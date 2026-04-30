import os
import asyncio
from typing import Any, Dict, List, Optional

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI

from service.command_service import build_command_service
from service.commands import ChatCommand


class RAGService:
    def __init__(self):
        self.ui_bot = None
        self._bot_init_lock = asyncio.Lock()
        self._bot_init_attempted = False

        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = Chroma(
            collection_name="bank_policies",
            embedding_function=self.embeddings,
            persist_directory="./chroma_db"
        )
        self.retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})

        self.llm = ChatOpenAI(
            model="meta-llama/llama-3-8b-instruct",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            temperature=0.2,
            streaming=True,
        )
        self.command_service = build_command_service(
            llm=self.llm,
            retriever=self.retriever,
            ensure_ui_bot=self._ensure_ui_bot,
            get_ui_bot=lambda: self.ui_bot,
        )

    async def init_ui_bot(self):
        async with self._bot_init_lock:
            if self._bot_init_attempted:
                return
            self._bot_init_attempted = True
            try:
                from service.playwright_bot import BankUIBot

                self.ui_bot = BankUIBot()
                await self.ui_bot.start()
                print("✅ UI bot initialized in RAG service")
            except Exception as e:
                self.ui_bot = None
                print(f"⚠️ UI bot unavailable: {e}")

    async def _ensure_ui_bot(self):
        if self.ui_bot is None and not self._bot_init_attempted:
            await self.init_ui_bot()

    async def chat(
        self,
        query: str,
        user_id: Optional[int],
        user_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, str]:
        command = ChatCommand(
            query=query,
            user_id=user_id,
            user_context=user_context or {},
            conversation_history=conversation_history or [],
        )
        try:
            return await self.command_service.execute(command)
        except Exception as e:
            return {"response": f"❌ I couldn’t process your request. Error: {str(e)}"}
