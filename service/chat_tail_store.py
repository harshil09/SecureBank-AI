"""
Server-side verbatim chat tail (last N messages) with Redis TTL.
If REDIS_URL is unset or Redis is unreachable, operations no-op / return [].
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "").strip()
TAIL_MAX = max(1, int(os.getenv("CHAT_TAIL_MAX", "4")))
TTL_SEC = max(60, int(os.getenv("CHAT_TAIL_TTL_SECONDS", "86400")))
AUDIT_SECRET = os.getenv("CHAT_AUDIT_HMAC_SECRET", "").encode("utf-8")

_redis_client: Optional[redis.Redis] = None


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _redis_key(user_id: Optional[int], guest_session_id: Optional[str]) -> str:
    if user_id is not None:
        return f"chat:tail:user:{user_id}"
    if guest_session_id:
        return f"chat:tail:guest:{guest_session_id}"
    raise ValueError("chat tail requires user_id or guest_session_id")


def _content_hash(role: str, content: str, ts: str) -> str:
    payload = f"{role}|{ts}|{content}".encode("utf-8")
    if AUDIT_SECRET:
        return hmac.new(AUDIT_SECRET, payload, hashlib.sha256).hexdigest()
    return hashlib.sha256(payload).hexdigest()


def strip_for_llm(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for m in messages:
        role = str(m.get("role", "user")).strip().lower()
        if role not in {"user", "assistant"}:
            role = "user"
        content = str(m.get("content", ""))
        out.append({"role": role, "content": content})
    return out


def strip_for_client(messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    return strip_for_llm(messages)


async def _get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if not REDIS_URL:
        return None
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0,
            )
        except Exception:
            return None
    return _redis_client


class ChatTailStore:
    async def get_tail(
        self,
        *,
        user_id: Optional[int],
        guest_session_id: Optional[str],
    ) -> List[Dict[str, Any]]:
        try:
            r = await _get_redis()
            if not r:
                return []
            key = _redis_key(user_id, guest_session_id)
            raw = await r.get(key)
            if not raw:
                return []
            data = json.loads(raw)
            if not isinstance(data, list):
                return []
            return data[-TAIL_MAX:]
        except Exception:
            return []

    async def set_tail(
        self,
        *,
        user_id: Optional[int],
        guest_session_id: Optional[str],
        messages: List[Dict[str, Any]],
    ) -> None:
        try:
            r = await _get_redis()
            if not r:
                return
            key = _redis_key(user_id, guest_session_id)
            trimmed = messages[-TAIL_MAX:]
            await r.set(key, json.dumps(trimmed), ex=TTL_SEC)
        except Exception:
            pass

    async def append_exchange(
        self,
        *,
        user_id: Optional[int],
        guest_session_id: Optional[str],
        user_text: str,
        assistant_text: str,
    ) -> None:
        u_ts = _utc_iso()
        a_ts = _utc_iso()
        cur = await self.get_tail(user_id=user_id, guest_session_id=guest_session_id)
        cur.append(
            {
                "role": "user",
                "content": user_text,
                "ts": u_ts,
                "h": _content_hash("user", user_text, u_ts),
            }
        )
        cur.append(
            {
                "role": "assistant",
                "content": assistant_text,
                "ts": a_ts,
                "h": _content_hash("assistant", assistant_text, a_ts),
            }
        )
        await self.set_tail(
            user_id=user_id,
            guest_session_id=guest_session_id,
            messages=cur,
        )


def normalize_client_history_prior(
    conversation_history: List[Dict[str, Any]],
    query: str,
) -> List[Dict[str, str]]:
    """Drop duplicate current user turn if client included it in history."""
    if not conversation_history:
        return []
    q = query.strip()
    out: List[Dict[str, str]] = []
    for item in conversation_history:
        role = str(item.get("role", "user")).strip().lower()
        if role not in {"user", "assistant"}:
            role = "user"
        content = str(item.get("content", ""))
        out.append({"role": role, "content": content})
    if out and out[-1]["role"] == "user" and out[-1]["content"].strip() == q:
        out = out[:-1]
    return out[-TAIL_MAX:]


def resolve_prior_for_llm(
    server_tail: List[Dict[str, Any]],
    client_history: List[Dict[str, Any]],
    query: str,
) -> List[Dict[str, str]]:
    if server_tail:
        return strip_for_llm(server_tail)
    return normalize_client_history_prior(client_history, query)
