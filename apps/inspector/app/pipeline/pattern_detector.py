"""Step 3: Pattern Detection — programmatic clustering + LLM labeling.

Clustering is done entirely in code (difflib similarity).
LLM is used only to generate human-readable names and descriptions for clusters.
"""
from __future__ import annotations

import json
from collections import defaultdict
from difflib import SequenceMatcher

from crewai import LLM

from app.config import settings
from app.models import Pattern, TraceAnalysis

_SEVERITY_WEIGHT = {"low": 1, "medium": 2, "high": 3, "critical": 4}
_SIMILARITY_THRESHOLD = 0.6


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _cluster_programmatically(trace: TraceAnalysis) -> list[dict]:
    """Group issues by type, then merge similar descriptions within each type group."""
    # Group by type first
    by_type: dict[str, list] = defaultdict(list)
    for issue in trace.issues:
        by_type[issue.type].append(issue)

    clusters: list[dict] = []

    for issue_type, issues in by_type.items():
        # Within each type, merge by description similarity
        merged: list[list] = []
        for issue in issues:
            placed = False
            for group in merged:
                if _similarity(issue.description, group[0].description) >= _SIMILARITY_THRESHOLD:
                    group.append(issue)
                    placed = True
                    break
            if not placed:
                merged.append([issue])

        for group in merged:
            sessions = list({i.session_id for i in group})
            severities = [i.severity for i in group]
            most_common_severity = max(set(severities), key=severities.count)
            score = len(group) * _SEVERITY_WEIGHT.get(most_common_severity, 1)
            evidence_snippets = [
                f"{i.evidence.field}: {i.evidence.value[:100]}" for i in group[:3]
            ]

            clusters.append({
                "issue_type": issue_type,
                "frequency": len(group),
                "severity": most_common_severity,
                "affected_sessions": sessions,
                "score": score,
                "example_descriptions": [i.description for i in group[:3]],
                "confidence": len(sessions) / max(1, len(set(
                    i.session_id for i in trace.issues
                ))),
                "evidence_summary": "; ".join(evidence_snippets),
            })

    # Sort by score descending
    clusters.sort(key=lambda c: c["score"], reverse=True)
    return clusters


async def detect_patterns(trace: TraceAnalysis, total_sessions: int) -> list[Pattern]:
    """Cluster issues programmatically, then use LLM for naming only."""
    if not trace.issues:
        return []

    raw_clusters = _cluster_programmatically(trace)

    if not raw_clusters:
        return []

    # Single LLM call to label each cluster
    cluster_input = json.dumps([
        {
            "issue_type": c["issue_type"],
            "frequency": c["frequency"],
            "severity": c["severity"],
            "example_descriptions": c["example_descriptions"],
        }
        for c in raw_clusters
    ], indent=2)

    llm = LLM(model=settings.inspector_model)
    prompt = (
        f"For each cluster below, provide a short human-readable name (3-5 words) "
        f"and a 1-sentence description. Return JSON array with objects: "
        f"{{\"name\": string, \"description\": string}}.\n\n"
        f"Clusters:\n{cluster_input}\n\n"
        f"Return ONLY the JSON array, no prose."
    )

    try:
        response = llm.call([{"role": "user", "content": prompt}])
        raw = response if isinstance(response, str) else str(response)
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        labels = json.loads(raw.strip())
    except Exception:
        # Fallback: use type as name
        labels = [
            {"name": c["issue_type"].replace("_", " ").title(), "description": f"Recurring {c['issue_type']} issues."}
            for c in raw_clusters
        ]

    patterns: list[Pattern] = []
    for i, cluster in enumerate(raw_clusters):
        label = labels[i] if i < len(labels) else {"name": cluster["issue_type"], "description": ""}
        patterns.append(Pattern(
            name=label.get("name", cluster["issue_type"]),
            description=label.get("description", ""),
            issue_type=cluster["issue_type"],
            frequency=cluster["frequency"],
            severity=cluster["severity"],
            affected_sessions=cluster["affected_sessions"],
            confidence=round(cluster["confidence"], 2),
            evidence_summary=cluster["evidence_summary"],
        ))

    return patterns
