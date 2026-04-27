# Banking API & AI Assistant

Secure banking-style API with a **React** web app and an AI assistant that answers using retrieved policies and live account data.
---

## 🛠️ Tech Stack

![FastAPI](https://img.shields.io/badge/FastAPI-white?style=for-the-badge&logo=fastapi&logoColor=009688)
![React](https://img.shields.io/badge/React-white?style=for-the-badge&logo=react&logoColor=61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-white?style=for-the-badge&logo=sqlite&logoColor=003B57)
![JWT](https://img.shields.io/badge/JWT-white?style=for-the-badge&logo=jsonwebtokens&logoColor=000000)
![OAuth](https://img.shields.io/badge/OAuth%202.0-white?style=for-the-badge&logo=auth0&logoColor=EB5424)
![LangChain](https://img.shields.io/badge/LangChain-white?style=for-the-badge&logoColor=000000)
![Chroma](https://img.shields.io/badge/ChromaDB-white?style=for-the-badge&logoColor=FF6F00)
![HuggingFace](https://img.shields.io/badge/HuggingFace-white?style=for-the-badge&logo=huggingface&logoColor=FFCC00)
![OpenRouter](https://img.shields.io/badge/OpenRouter-white?style=for-the-badge&logoColor=000000)
![Playwright](https://img.shields.io/badge/Playwright-white?style=for-the-badge&logo=microsoft-playwright&logoColor=2EAD33)
![Python](https://img.shields.io/badge/Python-white?style=for-the-badge&logo=python&logoColor=3776AB)
![Vite](https://img.shields.io/badge/Vite-white?style=for-the-badge&logo=vite&logoColor=646CFF)

---
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
