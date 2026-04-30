import re


class TransactionParser:
    def extract_amount(self, query: str) -> float:
        nums = re.findall(r"[\₹\$\£]?\d+(?:\.\d+)?", query)
        if not nums:
            return 0.0
        cleaned = re.sub(r"[\₹\$\£]", "", nums[-1])
        return float(cleaned)

    def extract_steps(self, query: str) -> list[tuple[str, float]]:
        pattern = re.compile(
            r"(deposit|add|credit|withdraw|debit|take\s+out)\s*"
            r"(?:rs\.?|inr|₹|\$)?\s*(\d+(?:\.\d+)?)",
            flags=re.IGNORECASE,
        )
        steps: list[tuple[str, float]] = []
        for action_raw, amount_raw in pattern.findall(query):
            action = action_raw.lower()
            normalized = "deposit" if action in {"deposit", "add", "credit"} else "withdraw"
            amount = float(amount_raw)
            if amount > 0:
                steps.append((normalized, amount))
        return steps

    def detect_intent(self, query: str) -> str | None:
        lower_query = query.lower().strip()
        if any(
            keyword in lower_query
            for keyword in ("deposit", "add", "deposit money", "add money", "credit")
        ):
            return "deposit"
        if any(
            keyword in lower_query
            for keyword in ("withdraw", "debit", "withdraw money", "take out")
        ):
            return "withdraw"
        if "balance" in lower_query:
            return "balance"
        return None
