"""Step 4: Inspector Brain — root cause analysis + fix generation via CrewAI."""
from __future__ import annotations

import json

from crewai import Crew, Process

from app.crew.agents import get_inspector_brain
from app.crew.tasks import make_inspector_brain_task
from app.models import InspectorOutput, Pattern, TraceAnalysis


async def run_inspector_brain(
    trace: TraceAnalysis,
    patterns: list[Pattern],
    use_opus: bool = False,
) -> InspectorOutput:
    # Pass only the fields Inspector Brain needs — not the full trace
    issues_payload = [
        {
            "session_id": i.session_id,
            "type": i.type,
            "description": i.description,
            "severity": i.severity,
            "confidence": i.confidence,
            "evidence": {
                "field": i.evidence.field,
                "value": i.evidence.value,
                "reasoning": i.evidence.reasoning,
            },
        }
        for i in trace.issues
    ]
    # Also include claim mismatches — they're the richest signal for fabrication
    for cm in trace.claim_mismatches:
        issues_payload.append({
            "session_id": cm.session_id,
            "type": "fabrication",
            "description": f"Agent claimed: '{cm.claim}' but actually: '{cm.reality}'",
            "severity": "high",
            "confidence": 0.9,
            "evidence": {
                "field": cm.evidence.field,
                "value": cm.evidence.value,
                "reasoning": cm.evidence.reasoning,
            },
        })

    patterns_payload = [
        {
            "name": p.name,
            "issue_type": p.issue_type,
            "frequency": p.frequency,
            "severity": p.severity,
            "confidence": p.confidence,
            "description": p.description,
        }
        for p in patterns
    ]

    issues_json = json.dumps(issues_payload, indent=2)
    patterns_json = json.dumps(patterns_payload, indent=2)

    agent = get_inspector_brain(use_opus=use_opus)
    task = make_inspector_brain_task(agent, issues_json, patterns_json)

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )

    result = crew.kickoff()

    if isinstance(result.pydantic, InspectorOutput):
        output = result.pydantic
    else:
        raw = result.raw if hasattr(result, "raw") else str(result)
        try:
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw.strip())
            output = InspectorOutput(**data)
        except Exception:
            output = InspectorOutput(
                findings=[],
                fixes=[],
                summary="Inspector Brain could not produce a structured output.",
            )

    # Enforce hard caps
    output.findings = output.findings[:5]
    output.fixes = output.fixes[:5]

    return output
