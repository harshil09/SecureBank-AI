import asyncio
import re
import os
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI

from database import get_connection
from service.agent import OptimizedAgent


class RAGService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=6)
        self.ui_bot = None
        self._bot_init_lock = asyncio.Lock()
        self._bot_init_attempted = False

        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = Chroma(
            collection_name="bank_policies",
            embedding_function=self.embeddings,
            persist_directory="./chroma_db"
        )
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

        self.llm = ChatOpenAI(
            model="meta-llama/llama-3-8b-instruct",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2,
            streaming=True,
        )

    # =========================
    # MAIN CHAT
    # =========================
    async def init_ui_bot(self):
        """Initialize Playwright bot once; non-fatal if unavailable."""
        async with self._bot_init_lock:
            if self._bot_init_attempted:
                return
            self._bot_init_attempted = True
            try:
                from service.playwright_bot import BankUIBot

                self.ui_bot = BankUIBot()
                await self.ui_bot.start()
                print("✅ UI bot initialized in RAG service")
            except Exception as e:
                self.ui_bot = None
                print(f"⚠️ UI bot unavailable: {e}")

    async def _ensure_ui_bot(self):
        if self.ui_bot is None and not self._bot_init_attempted:
            await self.init_ui_bot()

    async def _run_ui_action(self, action: str, amount: float):
        """Best-effort UI automation, never blocks or breaks API response."""
        await self._ensure_ui_bot()
        if not self.ui_bot:
            return
        try:
            if action == "deposit":
                await self.ui_bot.deposit_ui(amount)
            elif action == "withdraw":
                await self.ui_bot.withdraw_ui(amount)
        except Exception as e:
            print(f"⚠️ UI automation failed for {action}: {e}")

    async def chat(self, query: str, user_id: Optional[int]) -> Dict[str, str]:
        # Fan-out: run independent analysis/retrieval tasks concurrently.
        intent_task = asyncio.to_thread(self._detect_intent, query)
        amount_task = asyncio.to_thread(self._extract_amount, query)
        tx_steps_task = asyncio.to_thread(self._extract_transaction_steps, query)
        context_task = asyncio.to_thread(self._retrieve_context, query)
        balance_task = (
            asyncio.to_thread(self._fetch_balance, user_id)
            if user_id is not None
            else asyncio.sleep(0, result=0.0)
        )
        intent, amount, tx_steps, context, balance = await asyncio.gather(
            intent_task, amount_task, tx_steps_task, context_task, balance_task
        )

        q = query.lower()

        # =========================
        # PRIORITY 1: BANK OPS
        # =========================
        if "balance" in q:
            if user_id is None:
                return {"response": "🔒 Please login to check your balance."}
            return {"response": f"💰 Your balance is ₹{balance}"}

        if tx_steps:
            if user_id is None:
                return {"response": "🔒 Please login to perform transactions."}
            return await self._execute_transaction_steps(user_id, tx_steps)

        if intent == "withdraw":
            if user_id is None:
                return {"response": "🔒 Please login to withdraw money."}
            if amount <= 0:
                return {"response": "❌ Invalid amount"}
            if balance < amount:
                return {"response": "❌ Insufficient balance"}
            return await self._withdraw(user_id, amount)

        if intent == "deposit":
            if user_id is None:
                return {"response": "🔒 Please login to deposit money."}
            if amount <= 0:
                return {"response": "❌ Invalid amount"}
            return await self._deposit(user_id, amount)

        # =========================
        # PRIORITY 2: RAG
        # =========================
        if context:
            # Fan-in: structured routing after concurrent preprocessing.
            return await self._rag(query, context)

        # =========================
        # PRIORITY 3: AGENT
        # =========================
        try:
            agent = OptimizedAgent(user_id)
            result = await agent.invoke(query)
            return {"response": str(result)}
        except Exception as e:
            return {"response": f"❌ I couldn’t process your request. Error: {str(e)}"}

    # =========================
    # RAG (FIXED OUTPUT STABILITY)
    # =========================
    async def _rag(self, query: str, context: str) -> Dict[str, str]:
        loop = asyncio.get_running_loop()

        prompt = f"""
You are a banking assistant.

RULES:
- Answer ONLY from context.
- Do NOT repeat words or sentences.
- Keep response SHORT (max 2–3 lines).

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

        res = await loop.run_in_executor(
            self.executor,
            lambda: self.llm.invoke(prompt)
        )

        # 🔥 FIX: remove repeated consecutive words
        cleaned = self._clean_text(res.content)

        return {"response": cleaned}

    # =========================
    # CLEAN OUTPUT
    # =========================
    def _clean_text(self, text: str) -> str:
        words = text.split()
        cleaned = []
        for w in words:
            if not cleaned or cleaned[-1] != w:
                cleaned.append(w)
        return " ".join(cleaned)

    # =========================
    # RETRIEVAL
    # =========================
    def _retrieve_context(self, query: str) -> str:
        docs = self.retriever.invoke(query)
        if not docs:
            return ""
        return "\n\n".join([d.page_content for d in docs])

    # =========================
    # INTENT / AMOUNT
    # =========================
    def _detect_intent(self, text: str) -> str | None:
        t = text.lower().strip()
        if any(kw in t for kw in ("deposit", "add", "deposit money", "add money")):
            return "deposit"
        if any(kw in t for kw in ("withdraw", "debit", "withdraw money", "take out")):
            return "withdraw"
        return None

    def _extract_amount(self, text: str) -> float:
        # Try to match “₹100”, “$100”, “100”, etc.
        nums = re.findall(r"[\₹\$\£]?\d+(?:\.\d+)?", text)
        if not nums:
            return 0.0
        last_num = nums[-1]
        # Remove currency symbol if present
        cleaned = re.sub(r"[\₹\$\£]", "", last_num)
        return float(cleaned)

    def _extract_transaction_steps(self, text: str) -> list[tuple[str, float]]:
        pattern = re.compile(
            r"(deposit|add|credit|withdraw|debit|take\s+out)\s*"
            r"(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d+)?)",
            flags=re.IGNORECASE,
        )
        steps: list[tuple[str, float]] = []
        for action_raw, amount_raw in pattern.findall(text):
            action = action_raw.lower()
            normalized_action = "deposit" if action in {"deposit", "add", "credit"} else "withdraw"
            amount = float(amount_raw)
            if amount > 0:
                steps.append((normalized_action, amount))
        return steps

    async def _execute_transaction_steps(
        self, user_id: int, tx_steps: list[tuple[str, float]]
    ) -> Dict[str, str]:
        responses: list[str] = []
        for action, amount in tx_steps:
            if action == "deposit":
                result = await self._deposit(user_id, amount)
            else:
                current_balance = self._fetch_balance(user_id)
                if current_balance < amount:
                    responses.append(f"❌ Withdraw ₹{amount} failed: insufficient balance")
                    continue
                result = await self._withdraw(user_id, amount)
            responses.append(result.get("response", ""))
        return {"response": "\n".join(r for r in responses if r)}

    # =========================
    # DB OPS (WITH SAFETY)
    # =========================
    async def _deposit(self, user_id: int, amount: float) -> Dict[str, str]:
        def db():
            with get_connection() as conn:
                cur = conn.cursor()
                # Ensure the account exists
                cur.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
                row = cur.fetchone()
                if row is None:
                    cur.execute(
                        "INSERT INTO accounts (user_id, balance) VALUES (?, ?)",
                        (user_id, 0.0)
                    )
                cur.execute(
                    "UPDATE accounts SET balance = balance + ? WHERE user_id = ?",
                    (amount, user_id),
                )
                cur.execute(
                    "INSERT INTO transactions (user_id, type, amount) VALUES (?, 'deposit', ?)",
                    (user_id, amount),
                )
                conn.commit()

        await asyncio.get_event_loop().run_in_executor(self.executor, db)
        asyncio.create_task(self._run_ui_action("deposit", amount))
        new_balance = self._fetch_balance(user_id)
        return {"response": f"✅ Deposited ₹{amount}. New balance: ₹{new_balance}"}

    async def _withdraw(self, user_id: int, amount: float) -> Dict[str, str]:
        def db():
            with get_connection() as conn:
                cur = conn.cursor()
                cur.execute(
                    "UPDATE accounts SET balance = balance - ? WHERE user_id = ? AND balance >= ?",
                    (amount, user_id, amount),
                )
                if cur.rowcount == 0:
                    raise ValueError("Insufficient balance or account not found")
                cur.execute(
                    "INSERT INTO transactions (user_id, type, amount) VALUES (?, 'withdraw', ?)",
                    (user_id, amount),
                )
                conn.commit()

        try:
            await asyncio.get_event_loop().run_in_executor(self.executor, db)
            asyncio.create_task(self._run_ui_action("withdraw", amount))
            new_balance = self._fetch_balance(user_id)
            return {"response": f"✅ Withdrawn ₹{amount}. New balance: ₹{new_balance}"}
        except ValueError:
            return {"response": "❌ Insufficient balance or account not found"}

    def _fetch_balance(self, user_id: int) -> float:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            # Return 0 if no account exists
            return float(row[0]) if row else 0.0