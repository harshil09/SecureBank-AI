"""
Banking API with OAuth2 and JWT Authentication

This FastAPI application provides a secure banking system with:
- User registration and authentication (email/password and Google OAuth)
- Account management (balance, deposits, withdrawals)
- Transaction history tracking
- JWT-based session management

Security:
    - Passwords hashed with Argon2
    - JWT tokens for API authentication
    - Google OAuth 2.0 integration

Environment Variables Required:
    - GOOGLE_CLIENT_ID: Google OAuth client ID
    - GOOGLE_CLIENT_SECRET: Google OAuth client secret
    - GOOGLE_REDIRECT_URI: OAuth callback URL (default: http://localhost:5000/auth/google/callback)
    - CORS_ALLOW_ORIGINS: Comma-separated browser origins (e.g. https://app.vercel.app).
      If unset, defaults to the Vite dev server (localhost:5173 and 127.0.0.1:5173).
"""
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from database import get_connection
from models import create_table
from schemas import User,Transactions
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi.middleware.cors import CORSMiddleware
from auth_utils import create_access_token, verify_token, SECRET_KEY
import re
import asyncio
from service.rag_service import RAGService
import os #Access system & environment variables
from dotenv import load_dotenv #Import function to read .env file
from latency import latency_middleware

# On Windows, force Proactor loop so asyncio subprocess support is available
# (Playwright needs subprocess APIs during startup).
if os.name == "nt" and hasattr(asyncio, "WindowsProactorEventLoopPolicy"):
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

#Load .env into environment
load_dotenv()

from routers import chat, ui_pipeline

# Password hashing context using Argon2 (OWASP recommended)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Hash password
def hash_password(password: str) -> str:
    """
    Hash a plain text password using Argon2.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        str: Argon2 hashed password string
        
    Note:
        Uses passlib's Argon2 scheme with automatic salt generation
    """
    return pwd_context.hash(password)

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Argon2 hash to check against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

app = FastAPI(
    title="Banking API",
    description="""
    A secure banking API with OAuth2 and JWT authentication.
    
    ## Features
    * User registration with email/password
    * Google OAuth 2.0 integration
    * Secure password hashing (Argon2)
    * JWT token-based authentication
    * Account balance management
    * Deposit and withdrawal operations
    * Transaction history tracking
    
    ## Authentication
    Most endpoints require a JWT token in the Authorization header:
    Authorization: Bearer <your_jwt_token>
    """

)

rag_service = None


app.include_router(chat.router)
app.include_router(ui_pipeline.router)
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(latency_middleware)

app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

#instance 
oauth=OAuth()

#register google as provider
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={'scope': 'openid email profile'},

)

create_table()

@app.on_event("startup")
async def startup():
    global rag_service
    try:
        rag_service = RAGService()
        await rag_service.init_ui_bot()
        print("✅ App fully initialized")
    except Exception as e:
        print("❌ Startup failed (non-fatal):", e)
        rag_service = RAGService()  # fallback without playwright

#STEP1: REDIRECT TO GOOGLE
@app.get("/auth/google/login")
async def google_login(request:Request):
    #if not os.getenv("GOOGLE_CLIENT_ID") or not os.getenv("GOOGLE_CLIENT_SECRET"):
     #   raise HTTPException(
      #      status_code=500,
       #     detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
       # )
    # Build callback URL from incoming host to keep session/state on same origin
    # (prevents localhost vs 127.0.0.1 state mismatch issues).
    redirect_uri = str(request.url_for("google_callback"))
    # prompt=select_account forces Google's account UI instead of silently reusing the browser session
    return await oauth.google.authorize_redirect(
        request, redirect_uri, prompt="select_account"
    )

#STEP 2: Google redirects back
@app.get("/auth/google/callback")
async def google_callback(request: Request):
    #STEP 3: Exchange code for token
    try:
        token = await oauth.google.authorize_access_token(request)
    except MismatchingStateError:
        return RedirectResponse(url="/auth/google/login", status_code=302)
    #STEP 4: Get user info
    user_info = token.get("userinfo")
    #Fallback (very important)
    if not user_info:#if token didnt contain user info
        #call google api to get a response object like(requests.response)
        user_info = await oauth.google.get("userinfo", token=token)
        #convert response into json format
        user_info = user_info.json()
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account missing email")
    display_name = user_info.get("name") or " ".join(
        p for p in (user_info.get("given_name"), user_info.get("family_name")) if p
    ).strip()
    if not display_name:
        display_name = email.split("@")[0]
    conn=get_connection()
    cursor=conn.cursor()
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email=?", (email,))
    result = cursor.fetchone()

    if not result:
        #create new user
        # Password is nullable in schema, so Google users can be created without password.
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, None))
        user_id=cursor.lastrowid
        cursor.execute("INSERT INTO accounts (user_id,balance) VALUES (?,0)", (user_id,))
        conn.commit()
    else:
        user_id=result[0]
    conn.close()

    # Issue JWT (Google "name" is used for dashboard welcome, e.g. "Harshil Soni")
    #jwt_token = create_access_token(
     #   {"user_id": user_id, "email": email, "name": display_name}
    #)
    #return RedirectResponse(url=f"http://127.0.0.1:8501/?token={jwt_token}", status_code=302)
    
    jwt_token = create_access_token(
    {"user_id": user_id, "email": email, "name": display_name}
)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(
    url=f"{frontend_url}/auth/callback?token={jwt_token}",
    status_code=302
)


@app.post("/signup")
def SignUp(user: User):
    """
    Register a new user with email and password.
    
    Creates a new user account with hashed password (Argon2) and initializes
    an associated account with zero balance.
    
    Args:
        user: User credentials (email and password)
    
    Returns:
        dict: Success message upon account creation
        
    Raises:
        HTTPException: 400 if email already exists in the database
        
    Example:
```json
        {
            "email": "user@example.com",
            "password": "securePassword123"
        }
```
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email=?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")
          # Hash password
        hashed_password = hash_password(user.password)  # 🔑 hash password
         # Insert new user
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)",
                       (user.email, hashed_password))
        user_id = cursor.lastrowid
         # Create account with 0 balance
        cursor.execute("INSERT INTO accounts (user_id, balance) VALUES (?, ?)", (user_id, 0))
        conn.commit()
        return {"message": "User created successfully"}

    finally:
        conn.close()

@app.post("/login")
def Login(user: User):
    """
    Authenticate user and return JWT access token.
    
    Verifies user credentials against hashed password in database.
    Creates account record if missing. Returns JWT token valid for 60 minutes.
    
    Args:
        user: User credentials (email and password)
    
    Returns:
        dict: Contains success message and JWT access_token
        
    Raises:
        HTTPException: 401 if credentials are invalid
        
    Security:
        Token expires in 60 minutes (ACCESS_TOKEN_EXPIRE_MINUTES)
    """
    conn = get_connection()
    cursor = conn.cursor()
    # fetch user by email
    cursor.execute(
        "SELECT id,password FROM users WHERE email=?",
        (user.email,),
    )
    result = cursor.fetchone()

    if not result or not verify_password(user.password, result[1]): # 🔑 verify hashed password
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = result[0]
    # ensure account exists
    cursor.execute("SELECT 1 FROM accounts WHERE user_id=?", (user_id,))
    if cursor.fetchone() is None:
        cursor.execute(
            "INSERT INTO accounts (user_id, balance) VALUES (?, 0)", (user_id,)
        )
    conn.commit()
    conn.close()

     # ✅ ADD NAME (fallback from email)
    #name = user.email.split("@")[0].replace(".", " ").title()

    name = re.sub(r"\d+", "", user.email.split("@")[0]).replace(".", " ").title()

     # ✅ FIX TOKEN (include user info like Google)
    token = create_access_token({
        "user_id": user_id,
        "email": user.email,
        "name": name
    })

    """token = create_access_token({"user_id": user_id})"""

    return {
    "message": "Login successful",
    "access_token": token,
    "user": {
            "name": name,
            "email": user.email
        }
    }

@app.get("/me")
def get_me(authorization: str = Header(None)):
    payload = verify_token(authorization)

    return {
        "user_id": payload["user_id"],
        "email": payload.get("email"),
        "name": payload.get("name")
    }    

#GET BALANCE
@app.get("/balance")
def get_balance(authorization: str = Header(None)):
    """
    Retrieve the current balance for the authenticated user.
    
    Requires valid JWT token in Authorization header.
    
    Args:
        authorization: Bearer token in format "Bearer <token>"
    
    Returns:
        dict: Current account balance
        
    Raises:
        HTTPException: 401 if token is invalid or missing
        HTTPException: 404 if user account not found
        
    Example Response:
```json
        {
            "balance": 1500.50
        }
```
    """

    print("Authorization header:", authorization)
    payload=verify_token(authorization)
    user_id=payload["user_id"]
    print("Authorization:", authorization)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT balance FROM accounts WHERE user_id=?", (user_id,)
    )
    result = cursor.fetchone()
    conn.close()

    if result is not None:
        return {"balance": result[0]}
    raise HTTPException(status_code=404, detail="user not found")

#Deposit
@app.post("/deposit")
def Deposit(txt: Transactions, authorization: str = Header(None)):
    """Deposit funds into authenticated user's account."""
    payload = verify_token(authorization)
    user_id = payload["user_id"]
    conn = get_connection()
    cursor=conn.cursor()
    # Update account balance atomically
    cursor.execute("UPDATE accounts SET balance = balance + ? WHERE  user_id=?", (txt.amount, user_id))
    # Record transaction for audit trail
    cursor.execute("INSERT INTO transactions (user_id,type,amount) VALUES (?, 'deposit', ?)", (user_id,txt.amount))
    conn.commit()
    # Fetch updated balance for confirmation
    cursor.execute("SELECT balance FROM accounts WHERE user_id=?", (user_id,))
    balance = cursor.fetchone()[0]
    conn.close()
    return {"message": "Deposit successful", "balance": balance}

#Withdraw
@app.post("/withdraw")
def withdraw(txt:Transactions, authorization: str = Header(None)):
    #token = authorization.split(" ")[1]
    payload = verify_token(authorization)
    user_id = payload["user_id"]
    conn=get_connection()
    cursor=conn.cursor()
    cursor.execute("SELECT balance FROM accounts where user_id=? ", (user_id,))
    balance=cursor.fetchone()[0]
    
    if txt.amount>balance:
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient funds")
    cursor.execute("UPDATE accounts SET balance= balance - ? WHERE user_id=?", (txt.amount, user_id))
    cursor.execute("INSERT INTO transactions (user_id,type,amount) VALUES (?, 'withdraw', ?)", (user_id,txt.amount))
    conn.commit()
    cursor.execute('SELECT balance FROM accounts WHERE user_id=?', (user_id,))
    new_balance=cursor.fetchone()[0]
    conn.close()
    return {"message": "Withdrawal successful", "balance": new_balance}


@app.get("/transactions")
def get_transactions(authorization: str = Header(None)):

    payload = verify_token(authorization)
    user_id = payload["user_id"]

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT amount, type, timestamp FROM transactions WHERE user_id=?", (user_id,))

    rows = cursor.fetchall()
    conn.close()

    # Convert to JSON
    transactions = []
    for row in rows:
        transactions.append({
            "amount": row[0],
            "type": row[1],
            "timestamp": row[2]
        })

    return transactions

