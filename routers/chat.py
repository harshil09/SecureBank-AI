from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio
import re

from service.rag_service import RAGService
from auth_utils import verify_token

router = APIRouter(prefix="/api/chat")

# ✅ Singleton RAG service
rag_service = RAGService()


# ----------------------------
# Request Model
# ----------------------------
class ChatRequest(BaseModel):
    query: str
    conversation_history: List[Dict[str, Any]] = []


# ----------------------------
# Response Model
# ----------------------------
class ChatResponse(BaseModel):
    response: str
    sources: List[Any] = []
    authenticated: bool = False


# ----------------------------
# AUTH HELPER
# ----------------------------
def get_user_context(authorization: Optional[str]) -> Dict[str, Any]:
    context: Dict[str, Any] = {
        "authenticated": False,
        "user_id": None,
        "name": None,
        "email": None,
    }
    if not authorization:
        return context

    try:
        # verify_token expects full header: "Bearer <token>"
        payload = verify_token(authorization.strip())
        user_id = payload.get("user_id")
        context["authenticated"] = user_id is not None
        context["user_id"] = int(user_id) if user_id is not None else None
        context["name"] = payload.get("name")
        context["email"] = payload.get("email")
        return context

    except Exception:
        return context


# =========================================================
# 💬 NORMAL CHAT
# =========================================================
@router.post("/message", response_model=ChatResponse)
async def chat_message(
    data: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    user_context = get_user_context(authorization)
    user_id = user_context.get("user_id")
    is_auth = bool(user_context.get("authenticated"))

    try:
        result = await rag_service.chat(
            query=data.query,
            user_id=user_id,
            user_context=user_context,
            conversation_history=data.conversation_history,
        )

        return ChatResponse(
            response=result.get("response", ""),
            sources=result.get("sources", []),
            authenticated=is_auth
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================
# ⚡ STREAMING CHAT (SAFE PSEUDO STREAM)
# =========================================================
@router.post("/message/stream")
async def chat_stream(
    data: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    user_context = get_user_context(authorization)
    user_id = user_context.get("user_id")
    is_auth = bool(user_context.get("authenticated"))

    async def event_generator():
        try:
            result = await rag_service.chat(
                query=data.query,
                user_id=user_id,
                user_context=user_context,
                conversation_history=data.conversation_history,
            )

            text = result.get("response", "")

            if not text:
                yield f"data: {json.dumps({'error': 'Empty response', 'done': True})}\n\n"
                return

            # Preserve source spacing/newlines while streaming.
            chunks = re.findall(r"\S+\s*", text)
            if not chunks:
                chunks = [text]

            for token in chunks:

                yield f"data: {json.dumps({
                    'content': token,
                    'authenticated': is_auth
                })}\n\n"

                await asyncio.sleep(0.025)

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )