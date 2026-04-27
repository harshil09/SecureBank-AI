# Banking API & AI Assistant

Secure banking-style API with a **React** web app and an AI assistant that answers using retrieved policies and live account data.
# 🏦 Banking API & AI Assistant  
### 🔐 Full-Stack Banking Platform with FastAPI, React, OAuth 2.0, JWT, and AI (RAG + Tool-Based Agent)

---

## 🛠️ Tech Stack

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens)
![OAuth](https://img.shields.io/badge/OAuth%202.0-EB5424?style=for-the-badge&logo=auth0)

![LangChain](https://img.shields.io/badge/LangChain-121212?style=for-the-badge)
![Chroma](https://img.shields.io/badge/ChromaDB-FF6F00?style=for-the-badge)

![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![OpenRouter](https://img.shields.io/badge/OpenRouter-000000?style=for-the-badge)

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=microsoft-playwright&logoColor=white)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite)
## Overview

- **Backend:** FastAPI — auth (JWT + Google OAuth), accounts, transactions  
- **Frontend:** React — login, dashboard, chat client calling the API  
- **AI:** RAG (Chroma + embeddings) + LLM (OpenRouter) + tool-using agent tied to SQLite  
- **Automation (optional):** Playwright for browser-based flows  

## Tech stack

| Area | Technologies |
|------|----------------|
| API & server | FastAPI, Uvicorn, Starlette |
| Auth & security | JWT (`python-jose`), Argon2 (`passlib`), Google OAuth (`Authlib`), CORS |
| Data & validation | SQLite, Pydantic |
| Frontend | React, (e.g. Vite), HTTP client (`fetch` / Axios), routing as needed |
| AI / RAG | LangChain (`langchain-community`, `langchain-openai`), Chroma, Hugging Face Embeddings (`sentence-transformers` / `all-MiniLM-L6-v2`), OpenRouter (e.g. Llama 3) |
| Agent & tools | Custom agent + LangChain tools, SQLite-backed queries |
| Browser automation | Playwright (Python) |
| Config & utilities | `python-dotenv`, latency middleware (`X-Process-Time` header) |

## Features

- User registration and login (email/password + Google OAuth)  
- JWT-protected API routes  
- Account operations: balance, deposit, withdraw  
- Transaction history  
- Chat API: policy RAG + authenticated tool use (balance, transactions, withdraw checks)  
- Streaming chat endpoint (where implemented)  
- Optional Playwright “bank UI” bot integration  

## Prerequisites

- Python 3.10+ (adjust if you use a different version)  
- Node.js + npm/pnpm/yarn (for the React app)  
- [Playwright](https://playwright.dev/python/) browsers if you use the UI bot (`playwright install`)  
- API keys / config: `OPENROUTER_API_KEY`, Google OAuth vars, JWT secret, etc.  

## Environment variables

Create a `.env` file (do **not** commit secrets). Example names used in the project:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`  
- `OPENROUTER_API_KEY`  
- JWT / session-related values as in `auth_utils` / `main.py`  

The React app may use its own `.env` (e.g. `VITE_API_BASE_URL`) pointing at the FastAPI server.

## Setup

**Backend**

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
# If you use LangChain / Playwright / Chroma, ensure they are listed in requirements.txt
