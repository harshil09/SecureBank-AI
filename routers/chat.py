from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio
import re

from service.rag_service import RAGService
from service.chat_tail_store import ChatTailStore, resolve_prior_for_llm, strip_for_client
from service.chat_audit import record_message_meta
from auth_utils import verify_token

router = APIRouter(prefix="/api/chat")

# ✅ Singleton RAG service
rag_service = RAGService()
tail_store = ChatTailStore()


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


class ChatContextResponse(BaseModel):
    messages: List[Dict[str, str]] = []


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


def _guest_session_id(header_val: Optional[str]) -> Optional[str]:
    if header_val and str(header_val).strip():
        return str(header_val).strip()
    return None


async def _persist_exchange(
    *,
    user_id: Optional[int],
    guest_session_id: Optional[str],
    user_text: str,
    assistant_text: str,
) -> None:
    if not assistant_text.strip():
        return
    if user_id is None and not guest_session_id:
        return
    await tail_store.append_exchange(
        user_id=user_id,
        guest_session_id=guest_session_id,
        user_text=user_text,
        assistant_text=assistant_text,
    )
    record_message_meta(
        user_id=user_id,
        guest_session_id=guest_session_id,
        role="user",
        content=user_text,
    )
    record_message_meta(
        user_id=user_id,
        guest_session_id=guest_session_id,
        role="assistant",
        content=assistant_text,
    )


@router.get("/context", response_model=ChatContextResponse)
async def chat_context(
    authorization: Optional[str] = Header(None),
    x_chat_session_id: Optional[str] = Header(None, alias="X-Chat-Session-Id"),
):
    user_context = get_user_context(authorization)
    user_id = user_context.get("user_id")
    guest_id = _guest_session_id(x_chat_session_id) if user_id is None else None
    if user_id is None and not guest_id:
        return ChatContextResponse(messages=[])
    tail = await tail_store.get_tail(user_id=user_id, guest_session_id=guest_id)
    return ChatContextResponse(messages=strip_for_client(tail))


# =========================================================
# 💬 NORMAL CHAT
# =========================================================
@router.post("/message", response_model=ChatResponse)
async def chat_message(
    data: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_chat_session_id: Optional[str] = Header(None, alias="X-Chat-Session-Id"),
):
    user_context = get_user_context(authorization)
    user_id = user_context.get("user_id")
    is_auth = bool(user_context.get("authenticated"))
    guest_id = _guest_session_id(x_chat_session_id) if user_id is None else None

    tail = await tail_store.get_tail(user_id=user_id, guest_session_id=guest_id)
    prior = resolve_prior_for_llm(tail, data.conversation_history, data.query)

    try:
        result = await rag_service.chat(
            query=data.query,
            user_id=user_id,
            user_context=user_context,
            conversation_history=prior,
        )
        text = result.get("response", "")

        await _persist_exchange(
            user_id=user_id,
            guest_session_id=guest_id,
            user_text=data.query,
            assistant_text=text,
        )

        return ChatResponse(
            response=text,
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
    authorization: Optional[str] = Header(None),
    x_chat_session_id: Optional[str] = Header(None, alias="X-Chat-Session-Id"),
):
    user_context = get_user_context(authorization)
    user_id = user_context.get("user_id")
    is_auth = bool(user_context.get("authenticated"))
    guest_id = _guest_session_id(x_chat_session_id) if user_id is None else None

    tail = await tail_store.get_tail(user_id=user_id, guest_session_id=guest_id)
    prior = resolve_prior_for_llm(tail, data.conversation_history, data.query)

    async def event_generator():
        try:
            result = await rag_service.chat(
                query=data.query,
                user_id=user_id,
                user_context=user_context,
                conversation_history=prior,
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

            await _persist_exchange(
                user_id=user_id,
                guest_session_id=guest_id,
                user_text=data.query,
                assistant_text=text,
            )

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
