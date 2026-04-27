import streamlit as st
import requests
import pandas as pd

BASE_URL = "http://127.0.0.1:5000"

# ===== HANDLE OAUTH CALLBACK =====
# Check if token is in URL (from Google OAuth redirect)
query_params = st.query_params
# OAuth callback always sends ?token= — apply it even if an old JWT was still in session
if "token" in query_params:
    raw_token = query_params.get("token")
    if isinstance(raw_token, list):
        raw_token = raw_token[0] if raw_token else ""
    if raw_token:
        st.session_state.token = raw_token
        st.session_state.logged_in = "Dashboard"
        try:
            import json
            import base64
            payload = raw_token.split(".")[1]
            payload += "=" * (4 - len(payload) % 4)
            decoded = json.loads(base64.b64decode(payload))
            if decoded.get("name"):
                st.session_state.username = decoded["name"]
            elif decoded.get("email"):
                st.session_state.username = decoded["email"].split("@")[0]
        except Exception:
            st.session_state.username = "User"
        st.query_params.clear()
        st.rerun()
    
st.markdown("""
<style>

/* App background */
.stApp {
    background-color: #0f172a;  /* Background color */
    color: #e2e8f0;             /* Default text color */
    font-family: 'Segoe UI', sans-serif;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background-color: #020617;
}

/* Buttons */
.stButton>button {
    background-color: #2563eb;  /* Primary */
    color: white;
    border-radius: 10px;
    padding: 10px 18px;
    font-weight: 600;
    border: none;
    transition: 0.3s;
}
.stButton>button:hover {
    background-color: #1d4ed8;  /* Darker Primary on hover */
    transform: scale(1.05);
}

/* Success / Green buttons can be styled inline in code for Deposit */
.success-btn {
    background-color: #22c55e; /* Success */
}

/* Danger / Red buttons can be styled inline for Withdraw */
.danger-btn {
    background-color: #ef4444; /* Danger */
}

/* Inputs */
.stTextInput input, .stNumberInput input {
    border-radius: 10px;
    padding: 8px;
    background-color: #020617;
    color: white;
    border: 1px solid #334155;
}

/* Cards */
.card {
    background-color: #1e293b;  /* Secondary */
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0px 8px 20px rgba(0,0,0,0.4);
    margin-bottom: 20px;
    transition: 0.3s;
}
.card:hover {
    transform: translateY(-5px);
}

/* Headings */
h1, h2, h3 {
    color: #f1f5f9;
}

/* Table */
[data-testid="stDataFrame"] {
    background-color: #020617;
    border-radius: 12px;
}

</style>
""", unsafe_allow_html=True)

#st.title("🔐 Login & Signup System")
#initialize session state
if "logged_in" not in st.session_state:
    st.session_state.logged_in = "Login"

if "user_id" not in st.session_state:
    st.session_state.user_id = None

if "token" not in st.session_state:
    st.session_state.token = None

if "username" not in st.session_state:
    st.session_state.username = "User"


# Determine the index for the selectbox based on session state
menu_options = ["Login", "Signup", "Dashboard"]
current_index = menu_options.index(st.session_state.logged_in) if st.session_state.logged_in in menu_options else 0

# Sidebar menu
st.sidebar.markdown("""
<div style="text-align:center; padding:10px; color:#f1f5f9; font-weight:bold;">
🏦 MyBank Pro
</div>
""", unsafe_allow_html=True)


menu = st.sidebar.selectbox("Menu", menu_options, index=current_index)


# Sync sidebar selection → session state
st.session_state.logged_in = menu    


#Signup page
if st.session_state.logged_in == "Signup":
    st.markdown(f"""
    <div class="card" style="max-width:400px; margin:auto; text-align:center;">
        <h2 style="color:#f1f5f9;">📝 {menu}</h2>
        <p style="color:#94a3b8;">Join MyBank Pro and manage your finances securely</p>
    </div>
    """, unsafe_allow_html=True)
  
    email = st.text_input("Email", placeholder="you@example.com", key="signup_email")
    password = st.text_input("Password", type="password",placeholder="Enter strong password", key="signup_password")

    if st.button("Signup", key="signup_btn"):
        if email == "" or password == "":
            st.warning("Please fill in all fields")
        else:
            res = requests.post(f"{BASE_URL}/signup", json={"email": email, "password": password})
            if res.status_code == 200:
                st.success("Account created successfully ✅")
            #REDIRECT TO LOGIN
                st.session_state.logged_in = "Login"
                st.rerun()
            else:
                # Try to parse JSON, fallback to text
                try:
                    error_detail = res.json().get("detail", str(res.json()))
                except Exception:
                    error_detail = res.text  # fallback to raw text
                st.error(f"Error: {error_detail}")
            #st.error("Failed to create account")
                #st.error(res.json()["detail"])
    st.markdown("</div>", unsafe_allow_html=True)
    st.markdown('<p style="text-align:center; color:#94a3b8;">Already have an account? <a href="#" onclick="window.location.reload();">Login here</a></p>', unsafe_allow_html=True)


elif st.session_state.logged_in == "Login":
    st.markdown(f"""
    <div class="card" style="max-width:400px; margin:auto; text-align:center;">
        <h2 style="color:#f1f5f9;">🔐 {menu}</h2>
        <p style="color:#94a3b8;">Welcome back! Please login to continue</p>
    </div>
    """, unsafe_allow_html=True)


    #st.title(f"🔐 {menu} System")
    email = st.text_input("Username", placeholder="you@example.com", key="login_email")
    password = st.text_input("Password", type="password", placeholder="Enter your password", key="login_password")
    if st.button("Login", key="login_btn",use_container_width=True,help="Login to dashboard",):
        if email == "" or password =="":
            st.warning("enter all fields")
        else:
            res = requests.post(
                f"{BASE_URL}/login",
                json={"email": email, "password": password},
            )
            
            if res.status_code == 200:
                st.success("Login successful")
                #st.session_state.user_id = res.json()["user_id"]
                st.session_state.token = res.json()["access_token"]
                st.session_state.username = email.split("@")[0]   # simple username
                #st.write("TOKEN:", st.session_state.token)
                st.write(st.session_state.token)
                st.session_state.logged_in = "Dashboard"
                st.rerun()
            else:
                st.error("Login failed")
   

    st.markdown("""
<style>
.google-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background-color: white;
    color: #374151;
    font-weight: 600;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* Hover effect */
.google-btn:hover {
    background-color: #f9fafb;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    transform: translateY(-1px);
}

/* Click effect */
.google-btn:active {
    transform: scale(0.98);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Logo styling */
.google-btn img {
    width: 20px;
    height: 20px;
}
</style>
""", unsafe_allow_html=True)


    st.markdown(f"""
<a href="{BASE_URL}/auth/google/login" target="_self" style="text-decoration:none;">
    <button class="google-btn">
        <img src="https://developers.google.com/identity/images/g-logo.png"/>
        Continue with Google
    </button>
</a>
""", unsafe_allow_html=True)

elif st.session_state.logged_in == "Dashboard":
    st.title(f"🏦 {menu}")
    st.markdown(f"""
<div style="
    background-color:#1e293b; 
    padding:20px; 
    border-radius:16px;
    margin-bottom:20px;
">
    <h2 style="color:#f1f5f9; margin-bottom:5px;">👋 Welcome, {st.session_state.username}!</h2>
    <p style="color:#94a3b8; margin:0;">Manage your finances efficiently and securely</p>
</div>
""", unsafe_allow_html=True)
    #user_id = st.session_state.user_id

    #if user_id is None:
     #   st.warning("Please log in first.")
      #  st.session_state.logged_in = "Login"
       # st.stop()
    #CHECK IF TOKEN EXISTS
    if st.session_state.token is None:
        st.warning("Please log in first.")
        st.session_state.logged_in = "Login"
        st.stop()
     #Create headers with JWT token
    headers = {
        "Authorization": f"Bearer {st.session_state.token}"
    }
     # CREATE TABS
    tab1, tab2 = st.tabs(["💳 Actions", "📊 Insights"])
    with tab1:
        #st.subheader("💳 Deposit & Withdraw")
        # ===== PROFESSIONAL COLUMNS LAYOUT =====
        col1, col2 = st.columns(2)

        # Deposit Column
        with col1:
            st.markdown(f"""
    <div class="card">
        <h3>💰 Deposit</h3>
        <p>Top up your account instantly</p>
    </div>
    """, unsafe_allow_html=True)
            deposit_amt = st.number_input("Deposit Amount", min_value=0,key="deposit_input")
            if st.button("Deposit", disabled=deposit_amt <= 0,key="deposit_btn"):
                if deposit_amt<=0:
                    st.warning("Enter valid amount")
                else:
                    with st.spinner("Processing deposit..."):
                        headers = {
                        "Authorization": f"Bearer {st.session_state.token}"
                        }
                        res = requests.post(
                            f"{BASE_URL}/deposit",
                            json={"amount": deposit_amt}, headers=headers
                            )
                    if res.status_code == 200:
                        st.success(f"Deposit successful! New Balance: ${res.json()['balance']}")
                        st.rerun()
                    else:
                        st.error(res.json()["detail"])
        # Withdraw Column
        with col2:    
            st.markdown(f"""
    <div class="card">
        <h3>💸 Withdraw</h3>
        <p>Withdraw funds securely</p>
    </div>
    """, unsafe_allow_html=True)
            withdraw_amt = st.number_input("Withdraw Amount", min_value=0,key="withdraw_input")
            if st.button("Withdraw",  key="withdraw_btn", disabled=withdraw_amt <= 0):
                if withdraw_amt<=0:
                     st.warning("Enter valid amount")
                else:
                    with st.spinner("Processing withdrawal..."):
                        headers = {
                        "Authorization": f"Bearer {st.session_state.token}"
                        }
                        res = requests.post(
                            f"{BASE_URL}/withdraw",
                            json={"amount": withdraw_amt},headers=headers
                            )
                    if res.status_code == 200:
                        st.success(f"Withdrawal successful! New Balance: ${res.json()['balance']}")
                        st.rerun()
                    else:
                        st.error(res.json()["detail"])
    
    with tab2:
            # GET_BALANCE
        res = requests.get(f"{BASE_URL}/balance", headers=headers)
        # Check if the request was successful
        if res.status_code == 200:
        # Use .get() to avoid KeyError just in case
            balance = res.json().get("balance")
            if balance is not None:
                st.markdown(f"""
    <div class="card" style="text-align:center;">
        <h2 style="color:#94a3b8;">Current Balance</h2>
        <h1 style="color:turquoise;">₹ {balance}</h1>
    </div>
    """, unsafe_allow_html=True)
            #st.write(f"**Current Balance:** ${balance}")
            else:
                st.error("Balance not found in response.")
        else:
    # Handle errors returned from FastAPI
            st.error(f"Status Code: {res.status_code}")
            st.write(res.text)
            st.subheader("📊 Account Info")
        # TRANSACTION HISTORY
        st.markdown("---")
        #st.subheader("📜 Transaction History")

        with st.spinner("Fetching transactions..."):
            headers = {
                "Authorization": f"Bearer {st.session_state.token}"
                }
            res = requests.get(f"{BASE_URL}/transactions", headers=headers)

        # Handle response
        if res.status_code == 200:
            data = res.json()

            if len(data) == 0:
                st.info("No transactions found.")
            else:
            # Convert to DataFrame
                df = pd.DataFrame(data)

            # Optional: Rename columns nicely
                df.columns = ["amount", "type", "timestamp"]

            # Optional: Format
                df["amount"] = df["amount"].apply(lambda x: f"${x}")
                df["type"] = df["type"].apply(lambda x: "🟢 Deposit" if x=="deposit" else "🔴 Withdraw")
                #df["type"] = df["type"].str.capitalize()
                st.markdown("<h3>📜 Recent Transactions</h3>", unsafe_allow_html=True)

            # Show table
                st.dataframe(df, use_container_width=True,height=300)

        else:
            st.error(f"Error fetching transactions (Status {res.status_code})")
            st.write(res.text)
   
    # Logout
    if st.sidebar.button("Logout"):
        st.session_state.token = None
        st.session_state.logged_in = "Login"
        st.rerun()

