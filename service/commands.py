class Command:
    pass


class BalanceCommand(Command):
    def __init__(self, user_id: int, recent_limit: int = 3):
        self.user_id = user_id
        self.recent_limit = recent_limit


class DepositCommand(Command):
    def __init__(self, user_id: int, amount: float):
        self.user_id = user_id
        self.amount = amount


class WithdrawCommand(Command):
    def __init__(self, user_id: int, amount: float):
        self.user_id = user_id
        self.amount = amount


class MultiTransactionCommand(Command):
    def __init__(self, user_id: int, steps: list[tuple[str, float]]):
        self.user_id = user_id
        self.steps = steps


class RAGCommand(Command):
    def __init__(
        self,
        query: str,
        context: str,
        injected_context: str = "",
        conversation_history: list[dict] | None = None,
    ):
        self.query = query
        self.context = context
        self.injected_context = injected_context
        self.conversation_history = conversation_history or []


class AgentCommand(Command):
    def __init__(self, query: str, user_id: int | None = None):
        self.query = query
        self.user_id = user_id


class ChatCommand(Command):
    def __init__(
        self,
        query: str,
        user_id: int | None,
        user_context: dict | None = None,
        conversation_history: list[dict] | None = None,
    ):
        self.query = query
        self.user_id = user_id
        self.user_context = user_context or {}
        self.conversation_history = conversation_history or []


class RouteCommand(Command):
    def __init__(
        self,
        query: str,
        user_id: int | None,
        user_context: dict | None = None,
        conversation_history: list[dict] | None = None,
    ):
        self.query = query
        self.user_id = user_id
        self.user_context = user_context or {}
        self.conversation_history = conversation_history or []


# Backward compatibility for older imports/usages.
RagCommand = RAGCommand