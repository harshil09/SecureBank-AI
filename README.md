# Banking API & AI Assistant

Secure banking-style API with a **React** web app and an AI assistant that answers using retrieved policies and live account data.

## 🛠️ Tech Stack

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/FastAPI-black?style=for-the-badge&logo=fastapi&logoColor=009688">
  <img src="https://img.shields.io/badge/FastAPI-white?style=for-the-badge&logo=fastapi&logoColor=009688">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/React-black?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/React-white?style=for-the-badge&logo=react&logoColor=61DAFB">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/SQLite-black?style=for-the-badge&logo=sqlite&logoColor=4DB33D">
  <img src="https://img.shields.io/badge/SQLite-white?style=for-the-badge&logo=sqlite&logoColor=003B57">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/HuggingFace-black?style=for-the-badge&logo=huggingface&logoColor=FFD21E">
  <img src="https://img.shields.io/badge/HuggingFace-white?style=for-the-badge&logo=huggingface&logoColor=FFCC00">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Playwright-black?style=for-the-badge&logo=microsoft-playwright&logoColor=2EAD33">
  <img src="https://img.shields.io/badge/Playwright-white?style=for-the-badge&logo=microsoft-playwright&logoColor=2EAD33">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Python-black?style=for-the-badge&logo=python&logoColor=3776AB">
  <img src="https://img.shields.io/badge/Python-white?style=for-the-badge&logo=python&logoColor=3776AB">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Vite-black?style=for-the-badge&logo=vite&logoColor=646CFF">
  <img src="https://img.shields.io/badge/Vite-white?style=for-the-badge&logo=vite&logoColor=646CFF">
</picture>

<!-- Hugging Face -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/HuggingFace-black?style=for-the-badge&logo=huggingface&logoColor=FFD21E">
  <img src="https://img.shields.io/badge/HuggingFace-white?style=for-the-badge&logo=huggingface&logoColor=FFCC00">
</picture>

<!-- LangChain (no official logo on shields → clean fallback) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/LangChain-black?style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/LangChain-white?style=for-the-badge&logoColor=black">
</picture>

<!-- ChromaDB (no official logo) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/ChromaDB-black?style=for-the-badge&logoColor=orange">
  <img src="https://img.shields.io/badge/ChromaDB-white?style=for-the-badge&logoColor=FF6F00">
</picture>

<!-- SQLite -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/SQLite-black?style=for-the-badge&logo=sqlite&logoColor=4DB33D">
  <img src="https://img.shields.io/badge/SQLite-white?style=for-the-badge&logo=sqlite&logoColor=003B57">
</picture>

<!-- JWT -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
  <img src="https://img.shields.io/badge/JWT-white?style=for-the-badge&logo=jsonwebtokens&logoColor=black">
</picture>

<!-- Google OAuth -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/Google%20OAuth-black?style=for-the-badge&logo=google&logoColor=4285F4">
  <img src="https://img.shields.io/badge/Google%20OAuth-white?style=for-the-badge&logo=google&logoColor=4285F4">
</picture>

<!-- OpenRouter (no official logo) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/OpenRouter-black?style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/OpenRouter-white?style=for-the-badge&logoColor=black">
</picture>

![LangChain](https://img.shields.io/badge/LangChain-0F172A?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDBGRkQxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01em0wIDdsLTEwIDUgMTAgNSAxMC01LTEwLTV6Ii8+PC9zdmc+)

![ChromaDB](https://img.shields.io/badge/ChromaDB-111827?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkY2RjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjZmZmIi8+PC9zdmc+)
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
