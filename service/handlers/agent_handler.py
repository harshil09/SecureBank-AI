from service.commands import AgentCommand
from service.agent import OptimizedAgent


class AgentHandler:
    def __init__(self, agent_factory=None):
        self.agent_factory = agent_factory or OptimizedAgent

    async def handle(self, cmd: AgentCommand):
        agent = self.agent_factory(cmd.user_id)
        result = await agent.invoke(cmd.query)
        return {"response": str(result)}
