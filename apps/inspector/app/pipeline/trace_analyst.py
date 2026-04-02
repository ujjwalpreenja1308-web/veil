"""Step 2: Trace Analyst — evidence-grounded issue extraction via CrewAI."""
from __future__ import annotations

import json

from crewai import Crew, Process

from app.crew.agents import get_trace_analyst
from app.crew.tasks import make_trace_analyst_task
from app.models import SessionDigest, TraceAnalysis


async def run_trace_analyst(digest: SessionDigest, use_opus: bool = False) -> TraceAnalysis:
    digest_json = digest.model_dump_json(indent=2)

    agent = get_trace_analyst(use_opus=use_opus)
    task = make_trace_analyst_task(agent, digest_json)

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )

    result = crew.kickoff()

    # CrewAI returns the output_json as pydantic model when output_json is set
    if isinstance(result.pydantic, TraceAnalysis):
        return result.pydantic

    # Fallback: parse from raw output
    raw = result.raw if hasattr(result, "raw") else str(result)
    try:
        data = json.loads(raw)
        return TraceAnalysis(**data)
    except Exception:
        # Return empty analysis rather than crashing
        return TraceAnalysis(
            issues=[],
            failed_steps=[],
            tool_errors=[],
            claim_mismatches=[],
        )
