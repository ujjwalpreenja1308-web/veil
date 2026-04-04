"""CrewAI task definitions."""
from __future__ import annotations

import json

from crewai import Task

from app.models import InspectorOutput, Pattern, TraceAnalysis


def make_trace_analyst_task(agent, digest_json: str) -> Task:
    return Task(
        description=(
            f"Analyze the following session digest and extract all issues.\n\n"
            f"SESSION DIGEST:\n{digest_json}\n\n"
            "Rules:\n"
            "- Only extract issues that are EXPLICITLY present in the digest\n"
            "- Each issue MUST have an evidence field with: session_id, field, value, reasoning\n"
            "- field must be one of: errors, tools_failed, failed_steps, retries, anomalies, tool_errors, claim_mismatches\n"
            "- severity: low | medium | high | critical\n"
            "- confidence: 0.0-1.0 (how certain you are based on the signal strength)\n"
            "- type: hallucination | tool_failure | loop | timeout | missing_step | fabrication | other\n"
            "- description: 1 sentence max, no prose\n"
            "- If no issues are found, return empty lists\n"
        ),
        expected_output=(
            "A JSON object matching the TraceAnalysis schema with fields: "
            "issues, failed_steps, tool_errors, claim_mismatches. "
            "All items must include an evidence field. No prose, pure JSON."
        ),
        agent=agent,
        output_json=TraceAnalysis,
    )


def make_inspector_brain_task(agent, issues_json: str, patterns_json: str) -> Task:
    return Task(
        description=(
            f"Given the following issues and patterns from an AI agent's last 72 hours, "
            f"identify root causes and generate actionable fixes.\n\n"
            f"ISSUES:\n{issues_json}\n\n"
            f"PATTERNS:\n{patterns_json}\n\n"
            "Rules:\n"
            "- Max 5 findings, ranked by severity × frequency (highest first)\n"
            "- Max 5 fixes\n"
            "- Every finding MUST include: causal_chain (list of steps), evidence (list of EvidenceRef), confidence\n"
            "- Every fix MUST include an 'addresses' list referencing the exact Finding.issue strings it fixes\n"
            "- Fixes must be directly actionable: prompt text, retry code, guardrail logic — NOT generic advice\n"
            "- code_snippet should be actual usable code or prompt text, not pseudocode\n"
            "- confidence: 0.0-1.0\n"
            "- summary: 2-3 sentences covering the most important findings\n"
        ),
        expected_output=(
            "A JSON object matching the InspectorOutput schema with fields: "
            "findings (max 5), fixes (max 5), summary. Pure JSON, no prose."
        ),
        agent=agent,
        output_json=InspectorOutput,
    )
