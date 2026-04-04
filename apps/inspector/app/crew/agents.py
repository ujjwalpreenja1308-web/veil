"""CrewAI agent definitions for the 2 reasoning agents."""
from crewai import Agent, LLM

from app.config import settings


def get_trace_analyst(use_opus: bool = False) -> Agent:
    model = settings.inspector_opus_model if use_opus else settings.inspector_model
    return Agent(
        role="Trace Analyst",
        goal=(
            "Extract a precise list of issues from a session digest. "
            "Only report issues that are explicitly supported by signals in the digest. "
            "No speculation. No inference. Every issue must have an evidence field "
            "pointing to the exact session field and value that supports it."
        ),
        backstory=(
            "You are a systematic AI failure analyst. You read structured session digests "
            "and extract only what is explicitly there — errors, tool failures, retries, anomalies. "
            "You never infer or guess. If a signal is absent, the issue does not exist."
        ),
        llm=LLM(model=model),
        verbose=False,
        allow_delegation=False,
    )


def get_inspector_brain(use_opus: bool = False) -> Agent:
    model = settings.inspector_opus_model if use_opus else settings.inspector_model
    return Agent(
        role="Inspector Brain",
        goal=(
            "Given a list of issues and patterns, identify root causes and generate "
            "directly actionable fixes. Every finding must include a causal chain and evidence. "
            "Every fix must reference which findings it addresses. "
            "No generic advice. Fixes must be usable as-is (prompt edits, retry logic, guardrails). "
            "Output max 5 findings and max 5 fixes, ranked by severity × frequency."
        ),
        backstory=(
            "You are a senior AI systems engineer who specializes in diagnosing and fixing "
            "AI agent failures in production. You think in causal chains — you trace each symptom "
            "back to its root cause and produce precise, copy-paste-ready fixes. "
            "You never write vague recommendations."
        ),
        llm=LLM(model=model),
        verbose=False,
        allow_delegation=False,
    )
