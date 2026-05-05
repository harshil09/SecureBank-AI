"""
Optional SQLite metadata for chat (session + content hashes). Full text lives in Redis only.
"""
from __future__ import annotations

import hashlib
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional

from database import get_connection

_RETENTION_HOURS = 24 * 7


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _session_id_for_audit(user_id: Optional[int], guest_session_id: Optional[str]) -> Optional[str]:
    if user_id is not None:
        return f"user:{user_id}"
    if guest_session_id:
        return f"guest:{guest_session_id}"
    return None


def record_message_meta(
    *,
    user_id: Optional[int],
    guest_session_id: Optional[str],
    role: str,
    content: str,
) -> None:
    sid = _session_id_for_audit(user_id, guest_session_id)
    if not sid or not content:
        return
    now = _utc_now()
    expires = now + timedelta(hours=_RETENTION_HOURS)
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO chat_session (id, user_id, created_at, last_activity_at, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              last_activity_at=excluded.last_activity_at,
              expires_at=excluded.expires_at
            """,
            (
                sid,
                user_id,
                now.isoformat(),
                now.isoformat(),
                expires.isoformat(),
            ),
        )
        cur.execute(
            "SELECT COALESCE(MAX(seq), -1) + 1 FROM chat_message_meta WHERE session_id = ?",
            (sid,),
        )
        seq_row = cur.fetchone()
        seq = int(seq_row[0]) if seq_row and seq_row[0] is not None else 0
        cur.execute(
            """
            INSERT INTO chat_message_meta (session_id, seq, role, content_sha256, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (sid, seq, role, digest, now.isoformat()),
        )
        conn.commit()
    except sqlite3.Error:
        pass
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
