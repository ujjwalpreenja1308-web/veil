from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from app.db.client import get_db


def get_recent_sessions(org_id: str, agent_id: str, hours: int = 72) -> list[dict]:
    """Fetch all sessions for an agent in the last N hours."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    db = get_db()
    result = (
        db.table("sessions")
        .select("id, status, started_at, completed_at, cost, duration_ms, failure_type")
        .eq("org_id", org_id)
        .eq("agent_id", agent_id)
        .gte("started_at", cutoff)
        .order("started_at", desc=True)
        .execute()
    )
    return result.data or []


def get_session_events(org_id: str, session_id: str) -> list[dict]:
    """Fetch all events for a session."""
    db = get_db()
    result = (
        db.table("events")
        .select("id, step, type, payload, timestamp")
        .eq("org_id", org_id)
        .eq("session_id", session_id)
        .order("timestamp", desc=False)
        .execute()
    )
    return result.data or []


def get_agent_info(org_id: str, agent_id: str) -> dict | None:
    """Fetch agent metadata."""
    db = get_db()
    result = (
        db.table("agents")
        .select("id, name, created_at")
        .eq("org_id", org_id)
        .eq("id", agent_id)
        .single()
        .execute()
    )
    return result.data


def update_inspector_run(run_id: str, updates: dict[str, Any]) -> None:
    """Update an inspector_runs row. FastAPI owns the full lifecycle."""
    db = get_db()
    db.table("inspector_runs").update(updates).eq("id", run_id).execute()
