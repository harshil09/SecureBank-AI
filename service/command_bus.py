class CommandBus:
    def __init__(self):
        self.handlers = {}

    def register(self, command_type, handler):
        self.handlers[command_type] = handler

    async def execute(self, command):
        command_type = type(command)
        handler = self.handlers.get(command_type)
        if handler is None:
            raise ValueError(f"No handler registered for command: {command_type.__name__}")
        return await handler.handle(command)

    def register_handler(self, command_type, handler):
        self.register(command_type, handler)