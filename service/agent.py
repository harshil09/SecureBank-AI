# backend/service/agent.py

import asyncio
from typing import Dict, List, Tuple, Any
from concurrent.futures import ThreadPoolExecutor
from database import get_connection


# =========================================================
# 🧰 TOOLS (PURE + THREAD SAFE)
# =========================================================

def build_tools(user_id: int):

    def get_balance():
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM accounts WHERE user_id=?", (user_id,))
            row = cur.fetchone()
        return row[0] if row else 0

    def get_recent_transactions(limit: int = 5):
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT type, amount
                FROM transactions
                WHERE user_id=?
                ORDER BY id DESC
                LIMIT ?
            """, (user_id, limit))
            rows = cur.fetchall()

        return [{"type": r[0], "amount": r[1]} for r in rows]

    def check_can_withdraw(amount: float):
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM accounts WHERE user_id=?", (user_id,))
            row = cur.fetchone()

        balance = row[0] if row else 0
        return balance >= amount

    return {
        "get_balance": get_balance,
        "get_recent_transactions": get_recent_transactions,
        "check_can_withdraw": check_can_withdraw,
    }


# =========================================================
# 🧭 PLANNER
# =========================================================

def planner(query: str) -> List[Tuple[str, list]]:
    q = query.lower()
    tasks = []

    if "balance" in q:
        tasks.append(("get_balance", []))

    if "transaction" in q:
        tasks.append(("get_recent_transactions", [5]))

    if "withdraw" in q:
        amount = 500
        for word in q.split():
            if word.isdigit():
                amount = float(word)
        tasks.append(("check_can_withdraw", [amount]))

    return tasks


# =========================================================
# ⚡ FANOUT EXECUTOR
# =========================================================

class FanOutExecutor:
    def __init__(self, tools: Dict[str, Any]):
        self.tools = tools
        self.pool = ThreadPoolExecutor(max_workers=5)

    async def execute(self, tasks: List[Tuple[str, list]]) -> Dict[str, Any]:
        if not tasks:
            return {}

        loop = asyncio.get_running_loop()

        async def run_one(name, args):
            fn = self.tools[name]
            return await loop.run_in_executor(self.pool, fn, *args)

        results = await asyncio.gather(
            *(run_one(name, args) for name, args in tasks)
        )

        return {tasks[i][0]: results[i] for i in range(len(tasks))}

    def close(self):
        self.pool.shutdown(wait=True)


# =========================================================
# 🔗 FANIN
# =========================================================

def fan_in(results: Dict[str, Any]) -> str:
    if not results:
        return "No relevant data found."

    return f"""
💰 Balance: {results.get('get_balance', 'N/A')}

📜 Transactions:
{results.get('get_recent_transactions', [])}

💳 Withdraw Check:
{results.get('check_can_withdraw', 'N/A')}
""".strip()


# =========================================================
# 🤖 AGENT
# =========================================================

class OptimizedAgent:
    def __init__(self, user_id: int):
        self.tools = build_tools(user_id)
        self.executor = FanOutExecutor(self.tools)

    async def invoke(self, query: str):
        tasks = planner(query)
        results = await self.executor.execute(tasks)
        return fan_in(results)

    def close(self):
        self.executor.close()