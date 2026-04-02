"""Opus escalation logic.

Escalation re-runs the Inspector Brain with a more capable model when signals are ambiguous.
Only the Inspector Brain step escalates — Steps 1-3 always run on Sonnet.
"""
from __future__ import annotations

from app.models import Pattern, TraceAnalysis


def _has_contradictions(issues: list) -> bool:
    """Detect conflicting signals in the same session."""
    session_types: dict[str, set] = {}
    for issue in issues:
        sid = issue.session_id
        if sid not in session_types:
            session_types[sid] = set()
        session_types[sid].add(issue.type)

    # A session with both tool_failure and hallucination/fabrication may be contradictory
    contradiction_pairs = [
        {"tool_failure", "hallucination"},
        {"tool_failure", "fabrication"},
        {"missing_step", "tool_failure"},
    ]
    for types in session_types.values():
        for pair in contradiction_pairs:
            if pair.issubset(types):
                return True
    return False


def should_escalate_to_opus(trace: TraceAnalysis, patterns: list[Pattern]) -> bool:
    """Return True if Inspector Brain should use Opus instead of Sonnet."""
    # High severity with low confidence
    high_severity_low_confidence = any(
        issue.severity in ("high", "critical") and issue.confidence < 0.5
        for issue in trace.issues
    )

    # Conflicting signals across the trace
    conflicting_signals = _has_contradictions(trace.issues)

    # Many complex patterns
    complex_patterns = (
        len(patterns) > 5
        and any(p.frequency > 3 for p in patterns)
    )

    return high_severity_low_confidence or conflicting_signals or complex_patterns
