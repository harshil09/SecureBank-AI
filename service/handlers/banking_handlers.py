from typing import Any

from database import get_connection
from service.commands import (
    BalanceCommand,
    DepositCommand,
    MultiTransactionCommand,
    WithdrawCommand,
)


class BankingDbGateway:
    def fetch_balance(self, user_id: int) -> float:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            return float(row[0]) if row else 0.0

    def fetch_recent_transactions(self, user_id: int, limit: int = 3) -> list[dict[str, Any]]:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT type, amount, timestamp
                FROM transactions
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (user_id, limit),
            )
            rows = cur.fetchall()
            return [{"type": r[0], "amount": r[1], "timestamp": r[2]} for r in rows]

    def deposit(self, user_id: int, amount: float) -> None:
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    "INSERT INTO accounts (user_id, balance) VALUES (?, ?)",
                    (user_id, 0.0),
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

    def withdraw(self, user_id: int, amount: float) -> None:
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


class BalanceHandler:
    def __init__(self, db: BankingDbGateway):
        self.db = db

    async def handle(self, cmd: BalanceCommand):
        if cmd.user_id is None:
            return {"response": "🔒 Please login to check your balance."}
        balance = self.db.fetch_balance(cmd.user_id)
        recent_tx = self.db.fetch_recent_transactions(cmd.user_id, limit=cmd.recent_limit)
        return {
            "response": f"💰 Your balance is ₹{balance}",
            "balance": balance,
            "recent_transactions": recent_tx,
        }


class DepositHandler:
    def __init__(self, db: BankingDbGateway, ensure_ui_bot, get_ui_bot):
        self.db = db
        self.ensure_ui_bot = ensure_ui_bot
        self.get_ui_bot = get_ui_bot

    async def handle(self, cmd: DepositCommand):
        if cmd.user_id is None:
            return {"response": "🔒 Please login to perform transactions."}
        if cmd.amount <= 0:
            return {"response": "❌ Deposit amount must be greater than zero."}
        self.db.deposit(cmd.user_id, cmd.amount)
        await self.ensure_ui_bot()
        ui_bot = self.get_ui_bot()
        if ui_bot:
            try:
                await ui_bot.deposit_ui(cmd.amount)
            except Exception as e:
                print(f"⚠️ UI automation failed for deposit: {e}")
        new_balance = self.db.fetch_balance(cmd.user_id)
        return {"response": f"✅ Deposited ₹{cmd.amount}. New balance: ₹{new_balance}"}


class WithdrawHandler:
    def __init__(self, db: BankingDbGateway, ensure_ui_bot, get_ui_bot):
        self.db = db
        self.ensure_ui_bot = ensure_ui_bot
        self.get_ui_bot = get_ui_bot

    async def handle(self, cmd: WithdrawCommand):
        if cmd.user_id is None:
            return {"response": "🔒 Please login to perform transactions."}
        if cmd.amount <= 0:
            return {"response": "❌ Withdrawal amount must be greater than zero."}
        try:
            self.db.withdraw(cmd.user_id, cmd.amount)
        except ValueError:
            return {"response": "❌ Insufficient balance or account not found"}
        await self.ensure_ui_bot()
        ui_bot = self.get_ui_bot()
        if ui_bot:
            try:
                await ui_bot.withdraw_ui(cmd.amount)
            except Exception as e:
                print(f"⚠️ UI automation failed for withdraw: {e}")
        new_balance = self.db.fetch_balance(cmd.user_id)
        return {"response": f"✅ Withdrawn ₹{cmd.amount}. New balance: ₹{new_balance}"}


class MultiTransactionHandler:
    def __init__(self, command_service):
        self.command_service = command_service

    async def handle(self, cmd: MultiTransactionCommand):
        if cmd.user_id is None:
            return {"response": "🔒 Please login to perform transactions."}
        responses: list[str] = []
        for action, amount in cmd.steps:
            if amount <= 0:
                responses.append(f"❌ Invalid amount for {action}: {amount}")
                continue
            if action == "deposit":
                result = await self.command_service.execute(
                    DepositCommand(cmd.user_id, amount)
                )
            else:
                result = await self.command_service.execute(
                    WithdrawCommand(cmd.user_id, amount)
                )
            responses.append(result.get("response", ""))
        return {"response": "\n".join(r for r in responses if r)}
