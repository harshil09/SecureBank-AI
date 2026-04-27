# SecureBank-AI

# Banking API & AI Assistant

Secure banking-style API with a Streamlit dashboard and an AI assistant that answers using retrieved policies and live account data.

## Overview

- **Backend:** FastAPI — auth (JWT + Google OAuth), accounts, transactions  
- **Frontend:** Streamlit — login, dashboard, chat against the API  
- **AI:** RAG (Chroma + embeddings) + LLM (OpenRouter) + tool-using agent tied to SQLite  
- **Automation (optional):** Playwright for browser-based flows  

## Tech stack

| Area | Technologies |
|------|----------------|
| API & server | FastAPI, Uvicorn, Starlette |
| Auth & security | JWT (`python-jose`), Argon2 (`passlib`), Google OAuth (`Authlib`), CORS |
| Data & validation | SQLite, Pydantic |
| Frontend | Streamlit, Requests, Pandas |
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
- [Playwright](https://playwright.dev/python/) browsers if you use the UI bot (`playwright install`)  
- API keys / config: `OPENROUTER_API_KEY`, Google OAuth vars, JWT secret, etc.  

## Environment variables

Create a `.env` file (do **not** commit secrets). Example names used in the project:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`  
- `OPENROUTER_API_KEY`  
- JWT / session-related values as in `auth_utils` / `main.py`  

## Setup

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
# If you use LangChain / Playwright / Chroma, ensure they are listed in requirements.txt
