from langchain.tools import tool
from database import get_connection

def get_tools(user_id: int):

    @tool
    def get_balance() -> str:
        """Get current balance of the logged-in user"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return "Account not found"

        return f"Balance is ₹{row[0]}"

    @tool
    def deposit(amount: float) -> str:
        """Deposit money into user's account"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE accounts SET balance = balance + ? WHERE user_id = ?",
            (amount, user_id)
        )

        cursor.execute(
            "INSERT INTO transactions(user_id, type, amount) VALUES (?, 'deposit', ?)",
            (user_id, amount)
        )

        conn.commit()
        conn.close()

        return f"Deposited ₹{amount}"

    @tool
    def withdraw(amount: float) -> str:
     
        """Withdraw a specific numeric amount from user account"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT balance FROM accounts WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()

        if not row:
            return "Account not found"

        if row[0] < amount:
            return "Insufficient balance"

        cursor.execute(
            "UPDATE accounts SET balance = balance - ? WHERE user_id = ?",
            (amount, user_id)
        )

        conn.commit()
        conn.close()

        return f"Withdrawn ₹{amount}"   

    return [get_balance(), deposit(), withdraw()]

    