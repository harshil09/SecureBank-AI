from service.command_bus import CommandBus
from service.commands import (
    AgentCommand,
    BalanceCommand,
    ChatCommand,
    DepositCommand,
    MultiTransactionCommand,
    RAGCommand,
    RouteCommand,
    WithdrawCommand,
)
from service.handlers.agent_handler import AgentHandler
from service.handlers.banking_handlers import (
    BalanceHandler,
    BankingDbGateway,
    DepositHandler,
    MultiTransactionHandler,
    WithdrawHandler,
)
from service.handlers.chat_handler import ChatHandler
from service.handlers.rag_handler import RAGHandler
from service.handlers.route_handler import RouteHandler
from service.utils.transaction_parser import TransactionParser


class CommandService:
    def __init__(self, command_bus):
        self.command_bus = command_bus

    async def execute(self, command):
        return await self.command_bus.execute(command)


def build_command_service(llm, retriever, ensure_ui_bot, get_ui_bot):
    command_bus = CommandBus()
    command_service = CommandService(command_bus)
    db = BankingDbGateway()
    command_bus.register(ChatCommand, ChatHandler(command_service))
    command_bus.register(RouteCommand, RouteHandler(llm, TransactionParser()))
    command_bus.register(BalanceCommand, BalanceHandler(db))
    command_bus.register(DepositCommand, DepositHandler(db, ensure_ui_bot, get_ui_bot))
    command_bus.register(WithdrawCommand, WithdrawHandler(db, ensure_ui_bot, get_ui_bot))
    command_bus.register(MultiTransactionCommand, MultiTransactionHandler(command_service))
    command_bus.register(RAGCommand, RAGHandler(llm, retriever))
    command_bus.register(AgentCommand, AgentHandler())
    return command_service
