"""Step 1: Signal-prioritized session summarizer.

Compresses raw events into a structured SessionDigest.
Errors/failures are NEVER dropped — normal flows are summarized as counts.
"""
from __future__ import annotations

import json

from crewai import LLM

from app.config import settings
from app.models import (
    FailedStepBrief,
    RetryBrief,
    SessionDigest,
    SessionSummary,
    ToolFailureBrief,
)


def _extract_signals_from_events(events: list[dict]) -> dict:
    """Extract failure signals from raw events. Programmatic — no LLM."""
    errors: list[str] = []
    tools_called: list[str] = []
    tools_failed: list[ToolFailureBrief] = []
    failed_steps: list[FailedStepBrief] = []
    retries: dict[str, int] = {}
    anomalies: list[str] = []
    successful_steps = 0

    for event in events:
        payload = event.get("payload") or {}
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}

        step = event.get("step", "unknown")
        etype = event.get("type", "")

        # Errors — always capture
        error_val = (
            payload.get("gen_ai.error.message")
            or payload.get("error")
            or payload.get("exception")
        )
        if error_val:
            errors.append(f"[{step}] {str(error_val)[:200]}")
            failed_steps.append(FailedStepBrief(
                step=step,
                error=str(error_val)[:200],
                was_retried=False,  # updated below
            ))

        # Tool calls
        tool_name = payload.get("gen_ai.tool.name") or payload.get("tool_name")
        if tool_name:
            tools_called.append(tool_name)
            tool_error = payload.get("tool_error") or payload.get("error")
            agent_continued = bool(payload.get("agent_continued", True))
            if tool_error:
                tools_failed.append(ToolFailureBrief(
                    tool_name=tool_name,
                    error=str(tool_error)[:200],
                    agent_continued=agent_continued,
                ))

        # Retries — detect repeated step names
        if step in retries:
            retries[step] += 1
        else:
            retries[step] = 1

        # Anomalies
        output = payload.get("gen_ai.completion") or payload.get("output") or payload.get("result")
        if output is not None and str(output).strip() in ("", "null", "None", "{}"):
            anomalies.append(f"Empty output at step [{step}]")

        if not error_val and not (tool_name and tool_error):
            successful_steps += 1

    retry_briefs = [
        RetryBrief(action=action, count=count)
        for action, count in retries.items()
        if count > 1
    ]

    # Mark retried failed steps
    retry_actions = {r.action for r in retry_briefs}
    for fs in failed_steps:
        if fs.step in retry_actions:
            fs.was_retried = True

    return {
        "errors": errors,
        "tools_called": list(dict.fromkeys(tools_called)),  # dedupe, preserve order
        "tools_failed": tools_failed,
        "failed_steps": failed_steps,
        "retries": retry_briefs,
        "anomalies": anomalies,
        "successful_steps": max(0, successful_steps - len(failed_steps)),
    }


def _build_outcome(session: dict, signals: dict) -> str:
    """Build a 1-sentence outcome description."""
    status = session.get("status", "unknown")
    failure_type = session.get("failure_type")
    error_count = len(signals["errors"])
    tool_fail_count = len(signals["tools_failed"])

    if status == "failed":
        parts = [f"Session failed"]
        if failure_type:
            parts.append(f"({failure_type})")
        if error_count:
            parts.append(f"with {error_count} error(s)")
        if tool_fail_count:
            parts.append(f"and {tool_fail_count} tool failure(s)")
        return " ".join(parts) + "."
    elif signals["errors"] or signals["tools_failed"]:
        return f"Session completed with {error_count} error(s) and {tool_fail_count} tool failure(s)."
    else:
        return f"Session completed successfully with {signals['successful_steps']} step(s)."


async def summarize_sessions(
    sessions: list[dict],
    all_events: dict[str, list[dict]],
    agent_id: str,
    hours: int = 72,
) -> SessionDigest:
    """Build a signal-prioritized digest from raw session data and events."""
    session_summaries: list[SessionSummary] = []

    for session in sessions:
        sid = session["id"]
        events = all_events.get(sid, [])
        signals = _extract_signals_from_events(events)
        outcome = _build_outcome(session, signals)

        # Determine session status
        raw_status = session.get("status", "unknown")
        if raw_status in ("completed", "failed", "timeout"):
            status = raw_status
        elif signals["errors"]:
            status = "failed"
        else:
            status = raw_status

        cost_raw = session.get("cost")
        duration_raw = session.get("duration_ms")
        session_summaries.append(SessionSummary(
            session_id=sid,
            status=status,
            successful_steps=signals["successful_steps"],
            failed_steps=signals["failed_steps"],
            tools_called=signals["tools_called"],
            tools_failed=signals["tools_failed"],
            errors=signals["errors"],
            retries=signals["retries"],
            anomalies=signals["anomalies"],
            outcome=outcome,
            cost_usd=float(cost_raw) if cost_raw is not None else None,
            duration_ms=int(duration_raw) if duration_raw is not None else None,
            failure_type=session.get("failure_type"),
        ))

    return SessionDigest(
        agent_id=agent_id,
        session_count=len(session_summaries),
        time_range_hours=hours,
        sessions=session_summaries,
    )
