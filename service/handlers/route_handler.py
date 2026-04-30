import asyncio
import json
import re

from service.commands import (
    AgentCommand,
    BalanceCommand,
    DepositCommand,
    MultiTransactionCommand,
    RAGCommand,
    RouteCommand,
    WithdrawCommand,
)
from service.utils.transaction_parser import TransactionParser


class RouteHandler:
    def __init__(self, llm, parser: TransactionParser):
        self.llm = llm
        self.parser = parser

    async def handle(self, cmd: RouteCommand):
        query = cmd.query
        user_id = cmd.user_id
        user_context = cmd.user_context
        conversation_history = cmd.conversation_history

        route_plan = await self._plan_route(
            query=query,
            user_id=user_id,
            user_context=user_context,
            conversation_history=conversation_history,
        )
        route = route_plan.get("route", "rag")

        if route == "balance":
            return BalanceCommand(user_id)

        if route == "deposit":
            amount = route_plan.get("amount") or self.parser.extract_amount(query)
            return DepositCommand(user_id, amount)

        if route == "withdraw":
            amount = route_plan.get("amount") or self.parser.extract_amount(query)
            return WithdrawCommand(user_id, amount)

        if route == "transaction":
            steps = route_plan.get("steps")
            if not isinstance(steps, list):
                steps = self.parser.extract_steps(query)
            if not steps:
                intent = route_plan.get("intent")
                amount = route_plan.get("amount") or self.parser.extract_amount(query)
                if intent == "deposit":
                    return DepositCommand(user_id, amount)
                if intent == "withdraw":
                    return WithdrawCommand(user_id, amount)
                return AgentCommand(query, user_id)
            if len(steps) == 1:
                action, amount = steps[0]
                return (
                    DepositCommand(user_id, amount)
                    if action == "deposit"
                    else WithdrawCommand(user_id, amount)
                )
            return MultiTransactionCommand(user_id, steps)

        if route == "rag":
            return RAGCommand(
                query=query,
                context="",
                injected_context=route_plan.get("injected_context", ""),
                conversation_history=conversation_history,
            )

        return AgentCommand(query, user_id)

    async def _plan_route(
        self,
        query: str,
        user_id: int | None,
        user_context: dict,
        conversation_history: list[dict],
    ) -> dict[str, object]:
        lower_query = query.lower().strip()

        # Deterministic safety routing: non-financial FAQ/navigation should never hit balance.
        if self._is_non_financial_query(lower_query):
            return {"route": "rag", "amount": None}

        steps = self.parser.extract_steps(query)
        intent = self.parser.detect_intent(query)
        amount = self.parser.extract_amount(query)
        injected_context = self._build_injected_context(
            query=query,
            user_id=user_id,
            user_context=user_context,
            conversation_history=conversation_history,
        )

        history_text = self._history_to_text(conversation_history)
        prompt = f"""
You are a route planner for a banking concierge.

Pick EXACTLY one route from:
- "balance"
- "deposit"
- "withdraw"
- "transaction"
- "rag"
- "agent"

Return ONLY valid JSON with this schema:
{{
  "route": "balance|deposit|withdraw|transaction|rag|agent",
  "amount": number_or_null,
  "reason": "optional short reason"
}}

DETECTED_INTENT:
{intent}

DETECTED_STEPS:
{steps}

DETECTED_AMOUNT:
{amount}

INJECTED_CONTEXT:
{injected_context}

CONVERSATION_HISTORY:
{history_text}

USER_QUERY:
{query}
"""
        res = await asyncio.to_thread(self.llm.invoke, prompt)
        planned = self._extract_route_json(res.content)

        # Guardrail: balance route requires explicit balance intent keywords.
        if planned.get("route") == "balance" and not self._is_explicit_balance_query(lower_query):
            return {"route": "rag", "amount": None, "injected_context": injected_context}

        # Guardrail: transaction routes require executable intent/steps.
        if planned.get("route") in {"transaction", "deposit", "withdraw"}:
            has_steps = bool(steps)
            if not has_steps and intent not in {"deposit", "withdraw"}:
                return {"route": "rag", "amount": None}
            planned["intent"] = intent
            planned["steps"] = steps
            if planned.get("amount") is None:
                planned["amount"] = amount
        if planned.get("route") == "rag":
            planned["injected_context"] = injected_context
        return planned

    def _history_to_text(self, conversation_history: list[dict]) -> str:
        if not conversation_history:
            return "No prior conversation."
        recent = conversation_history[-6:]
        lines = []
        for item in recent:
            role = str(item.get("role", "user")).strip().lower()
            content = str(item.get("content", "")).strip()
            if not content:
                continue
            if role not in {"user", "assistant"}:
                role = "user"
            lines.append(f"{role}: {content}")
        return "\n".join(lines) if lines else "No prior conversation."

    def _extract_route_json(self, raw: str) -> dict[str, object]:
        if not raw:
            return {"route": "rag", "amount": None}
        text = raw.strip()
        parsed: dict[str, object] = {}
        try:
            parsed = json.loads(text)
        except Exception:
            match = re.search(r"\{[\s\S]*\}", text)
            if not match:
                return {"route": "rag", "amount": None}
            try:
                parsed = json.loads(match.group(0))
            except Exception:
                return {"route": "rag", "amount": None}

        route = str(parsed.get("route", "rag")).lower()
        if route not in {
            "balance",
            "deposit",
            "withdraw",
            "transaction",
            "rag",
            "agent",
        }:
            route = "rag"

        amount = parsed.get("amount")
        if not isinstance(amount, (int, float)):
            amount = None

        return {"route": route, "amount": amount}

    def _build_injected_context(
        self,
        query: str,
        user_id: int | None,
        user_context: dict,
        conversation_history: list[dict],
    ) -> str:
        lines: list[str] = []
        lines.append("assistant_mode: ai_concierge")
        lines.append(f"current_query: {query}")
        lines.append(f"is_authenticated: {bool(user_id is not None)}")
        lines.append(f"user_name: {user_context.get('name') or 'Guest'}")
        lines.append(f"user_email: {user_context.get('email') or 'Not available'}")
        lines.append(f"conversation_turns_seen: {len(conversation_history)}")
        lines.append(f"user_id: {user_id if user_id is not None else 'guest'}")
        return "\n".join(lines)

    def _is_explicit_balance_query(self, lower_query: str) -> bool:
        balance_keywords = (
            "balance",
            "my balance",
            "check balance",
            "account balance",
            "available balance",
        )
        return any(keyword in lower_query for keyword in balance_keywords)

    def _is_non_financial_query(self, lower_query: str) -> bool:
        non_financial_keywords = (
            "dashboard",
            "dashboard page",
            "user detail",
            "user details",
            "profile page",
            "settings page",
            "take me to",
            "go to",
            "open",
            "what are transaction limits",
            "transaction limits",
            "how is my data protected",
            "data protected",
            "data protection",
            "privacy",
            "security",
            "account types",
            "what account types",
        )
        return any(keyword in lower_query for keyword in non_financial_keywords)

