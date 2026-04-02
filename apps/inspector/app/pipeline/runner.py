"""Orchestrates the full 4-step Inspector pipeline."""
from __future__ import annotations

import time

from app.db.queries import get_agent_info, get_recent_sessions, get_session_events, update_inspector_run
from app.models import AnalyzeRequest
from app.pipeline.escalation import should_escalate_to_opus
from app.pipeline.inspector_brain import run_inspector_brain
from app.pipeline.pattern_detector import detect_patterns
from app.pipeline.summarizer import summarize_sessions
from app.pipeline.trace_analyst import run_trace_analyst


async def run_pipeline(req: AnalyzeRequest) -> None:
    """Run the full Inspector pipeline and write results to DB.

    FastAPI owns the full lifecycle — Next.js only creates the pending row.
    """
    start = time.time()

    try:
        await update_inspector_run(req.run_id, {"status": "running"})

        # ── Step 1: Fetch data ─────────────────────────────────────────────
        sessions = get_recent_sessions(req.org_id, req.agent_id, hours=72)

        if not sessions:
            await update_inspector_run(req.run_id, {
                "status": "complete",
                "sessions_analyzed": 0,
                "findings": [],
                "patterns": [],
                "fixes": [],
                "summary": "No sessions found in the last 72 hours for this agent.",
                "latency_ms": int((time.time() - start) * 1000),
                "completed_at": _now(),
            })
            return

        # Fetch events for each session
        all_events: dict[str, list[dict]] = {}
        for session in sessions:
            all_events[session["id"]] = get_session_events(req.org_id, session["id"])

        # ── Step 1: Compress into digest ───────────────────────────────────
        digest = await summarize_sessions(
            sessions=sessions,
            all_events=all_events,
            agent_id=req.agent_id,
            hours=72,
        )

        # ── Step 2: Trace Analyst ──────────────────────────────────────────
        trace = await run_trace_analyst(digest)

        # ── Step 3: Pattern Detection ──────────────────────────────────────
        patterns = await detect_patterns(trace, total_sessions=len(sessions))

        # ── Step 4: Inspector Brain (with optional Opus escalation) ────────
        escalate = should_escalate_to_opus(trace, patterns)
        output = await run_inspector_brain(trace, patterns, use_opus=escalate)

        latency_ms = int((time.time() - start) * 1000)

        await update_inspector_run(req.run_id, {
            "status": "complete",
            "sessions_analyzed": len(sessions),
            "findings": [f.model_dump() for f in output.findings],
            "patterns": [p.model_dump() for p in patterns],
            "fixes": [f.model_dump() for f in output.fixes],
            "summary": output.summary,
            "model": "opus" if escalate else "sonnet",
            "latency_ms": latency_ms,
            "completed_at": _now(),
        })

    except Exception as exc:
        latency_ms = int((time.time() - start) * 1000)
        await update_inspector_run(req.run_id, {
            "status": "failed",
            "error": str(exc)[:500],
            "latency_ms": latency_ms,
            "completed_at": _now(),
        })
        raise


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
