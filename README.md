# Banking API & AI Assistant

Full-stack, banking-style reference application: a **FastAPI** backend with **JWT** and **Google OAuth**, a **React** single-page client, and an **AI assistant** that combines **retrieval-augmented generation (RAG)** over policy documents with **tool-grounded** answers from live **SQLite** account data.

---

## Highlights

- **Secure API** — Argon2 password hashing, JWT access tokens, OAuth 2.0 (Google), CORS-aware design  
- **Core banking flows** — Registration, authentication, balances, deposits, withdrawals, transaction history  
- **Intelligent assistant** — Vector search over policies (Chroma + embeddings) and LLM reasoning (OpenRouter-compatible API)  
- **Grounded responses** — Agent-style tools query the database for balance, recent activity, and withdrawal eligibility  
- **Optional automation** — Playwright-driven browser flows for UI-centric scenarios  
- **Observability** — Request latency logging and `X-Process-Time` response header  

---

## Architecture

| Layer | Responsibility |
|--------|----------------|
| **React client** | Authentication UX, dashboard, banking actions, chat UI; consumes REST (and streaming chat where enabled) |
| **FastAPI service** | Auth, session/OAuth callbacks, account and transaction APIs, chat router |
| **RAG & agent** | Document retrieval, LLM completion, structured tool calls against SQLite |
| **Persistence** | SQLite for users, accounts, and transactions |
| **Vector store** | Chroma (persisted collection) for policy embeddings |

---

## Technology stack

### Backend

| Category | Technologies |
|----------|----------------|
| Runtime & framework | Python, **FastAPI**, **Starlette**, **Uvicorn** |
| Configuration | **python-dotenv** |
| Security & auth | **Passlib** (Argon2), **python-jose** (JWT), **Authlib** (Google OAuth), **cryptography** / **cffi** (transitive crypto stack) |
| HTTP & validation | **python-multipart**, **Pydantic** v2 |
| Data | **SQLite** (via `sqlite3`), optional **pandas** where used in tooling or scripts |
| AI & retrieval | **LangChain** (`langchain-community`, `langchain-openai`), **Chroma**, **Hugging Face** embeddings (`all-MiniLM-L6-v2` via `HuggingFaceEmbeddings`) |
| LLM routing | **OpenRouter**-compatible HTTP API (**ChatOpenAI** with custom `base_url`) |
| Automation | **Playwright** (Python, async API) |
| Middleware | Custom latency middleware (`X-Process-Time`, structured logging) |

### Frontend (`frontend/`)

| Category | Technologies |
|----------|----------------|
| UI library | **React 18**, **React DOM** |
| Build tooling | **Vite**, **@vitejs/plugin-react** |
| Styling | **Tailwind CSS**, **PostCSS**, **Autoprefixer** |
| Routing | **React Router** v6 |
| State | **Zustand** |
| Forms & validation | **React Hook Form**, **Zod**, **@hookform/resolvers** |
| HTTP client | **Axios** |
| UX | **Framer Motion**, **Lucide React** (icons) |
| Quality | **ESLint** (project config) |

---

## ✨ Features

### 🔐 Authentication & Security
- Email/password login with **Argon2 hashing**
- **JWT-based authentication** for stateless sessions
- **Google OAuth 2.0** integration via Authlib
- Secure API access with CORS configuration

---

### 💰 Banking Capabilities
- Account creation and management  
- Balance inquiry  
- Deposit and withdrawal operations  
- Persistent transaction history  

---

### 🤖 AI Assistant (RAG + Agent)
- Policy-aware responses using **Chroma vector store**
- Semantic retrieval with **Hugging Face embeddings**
- LLM reasoning via **OpenRouter-compatible API**
- **Tool-based execution**:
  - Fetch balance
  - Retrieve transactions
  - Validate withdrawals  

---

### ⚡ Real-Time Experience
- Streaming chat responses (where enabled)
- Low-latency interaction with async FastAPI endpoints  

---

### 🧪 Automation (Optional)
- Playwright-based browser automation
- Useful for UI testing and workflow simulation  

---

### 📊 Observability
- Request latency tracking  
- `X-Process-Time` response header  
- Structured logging for debugging and monitoring  

---

## Prerequisites

- **Python** 3.10+ (adjust to the version you standardize on)  
- **Node.js** LTS and **npm** (or **pnpm** / **yarn**)  
- **OpenRouter** API access (`OPENROUTER_API_KEY`) and Google OAuth credentials  
- **Playwright** browser binaries if you enable the UI automation path (`playwright install`)  

---

## Environment variables

**Backend** — use a `.env` file (never commit secrets). Typical variables include:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`  
- `OPENROUTER_API_KEY`  
- JWT / signing secrets as defined in `auth_utils.py` and `main.py`  

**Frontend** — configure the API base URL (e.g. `VITE_*` variables) consistent with `frontend/src/config/env.js`.

---

## Setup

### Backend

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Authentication Flow

### Email / Password

User → /register → Account created  
User → /login → JWT issued  
Client → sends JWT → backend validates  

---

### Google OAuth

User → /auth/google/login  
→ Redirect to Google  
→ Callback → JWT issued  

---

### AI Integration

JWT verified → Agent allowed to access:
- balance
- transactions
- withdrawal checks

---

## 👨‍💻 Author

**Harshil Soni**  
Backend Engineer | AI Systems | Full-Stack Developer  

- Focus: Scalable backend systems, AI integration, system design  
- Interests: Agentic AI, RAG systems, distributed architecture

---

## 📄 License

MIT License
