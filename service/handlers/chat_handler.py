from service.commands import ChatCommand, RouteCommand


class ChatHandler:
    def __init__(self, command_service):
        self.command_service = command_service

    async def handle(self, cmd: ChatCommand) -> dict[str, str]:
        if cmd.user_id is None and self._requires_authentication(cmd.query):
            return {
                "response": (
                    "🔒 Please login to view account details or perform transactions."
                )
            }

        next_command = await self.command_service.execute(
            RouteCommand(
                query=cmd.query,
                user_id=cmd.user_id,
                conversation_history=cmd.conversation_history,
                user_context=cmd.user_context,
            )
        )
        return await self.command_service.execute(next_command)

    def _requires_authentication(self, query: str) -> bool:
        normalized = query.lower()
        sensitive_keywords = (
            "my balance",
            "balance",
            "recent transaction",
            "recent transactions",
            "transaction history",
            "my transaction",
            "my transactions",
            "show transactions",
            "deposit",
            "withdraw",
            "transfer",
            "send money",
            "account statement",
        )
        return any(keyword in normalized for keyword in sensitive_keywords)
