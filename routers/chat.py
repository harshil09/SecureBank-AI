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
def get_user_id(authorization: Optional[str]) -> Optional[int]:
    if not authorization:
        return None

    try:
        # verify_token expects full header: "Bearer <token>"
        payload = verify_token(authorization.strip())
        user_id = payload.get("user_id")
        return int(user_id) if user_id is not None else None

    except Exception:
        return None


# =========================================================
# 💬 NORMAL CHAT
# =========================================================
@router.post("/message", response_model=ChatResponse)
async def chat_message(
    data: ChatRequest,
    authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)
    is_auth = user_id is not None

    try:
        # ✅ FIX: await missing earlier
        result = await rag_service.chat(
            query=data.query,
            user_id=user_id
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
    user_id = get_user_id(authorization)
    is_auth = user_id is not None

    async def event_generator():
        try:
            # ✅ FIX: await missing earlier
            result = await rag_service.chat(
                query=data.query,
                user_id=user_id
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