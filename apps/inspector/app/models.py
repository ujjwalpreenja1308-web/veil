from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# ─── Request ────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    org_id: str
    agent_id: str
    run_id: str


# ─── Step 1: Session Summarizer output ──────────────────────────────────────

class FailedStepBrief(BaseModel):
    step: str
    error: str
    was_retried: bool


class ToolFailureBrief(BaseModel):
    tool_name: str
    error: str
    agent_continued: bool


class RetryBrief(BaseModel):
    action: str
    count: int


class SessionSummary(BaseModel):
    session_id: str
    status: str                             # completed | failed | timeout
    successful_steps: int                   # count only
    failed_steps: list[FailedStepBrief]     # always included in full
    tools_called: list[str]
    tools_failed: list[ToolFailureBrief]    # always included in full
    errors: list[str]                       # never truncated
    retries: list[RetryBrief]
    anomalies: list[str]
    outcome: str                            # 1-sentence result


class SessionDigest(BaseModel):
    agent_id: str
    session_count: int
    time_range_hours: int
    sessions: list[SessionSummary]


# ─── Step 2: Trace Analyst output ───────────────────────────────────────────

class Evidence(BaseModel):
    session_id: str
    field: str      # which SessionSummary field: "errors", "tools_failed", "anomalies", etc.
    value: str      # the specific signal value
    reasoning: str  # 1 sentence: why this signal indicates the issue


class Issue(BaseModel):
    session_id: str
    type: Literal[
        "hallucination", "tool_failure", "loop",
        "timeout", "missing_step", "fabrication", "other"
    ]
    description: str    # 1 sentence max
    severity: Literal["low", "medium", "high", "critical"]
    confidence: float   # 0.0-1.0
    evidence: Evidence


class FailedStep(BaseModel):
    session_id: str
    step: str
    error: str
    was_handled: bool
    evidence: Evidence


class ToolError(BaseModel):
    session_id: str
    tool_name: str
    error: str
    agent_continued: bool
    evidence: Evidence


class ClaimMismatch(BaseModel):
    session_id: str
    claim: str
    reality: str
    evidence: Evidence


class TraceAnalysis(BaseModel):
    issues: list[Issue]
    failed_steps: list[FailedStep]
    tool_errors: list[ToolError]
    claim_mismatches: list[ClaimMismatch]


# ─── Step 3: Pattern Detection output ───────────────────────────────────────

class Pattern(BaseModel):
    name: str               # LLM-generated label
    description: str        # LLM-generated 1-sentence summary
    issue_type: str
    frequency: int          # programmatic
    severity: str           # programmatic (most common)
    affected_sessions: list[str]
    confidence: float       # frequency / total_sessions
    evidence_summary: str   # aggregated from constituent issues


# ─── Step 4: Inspector Brain output ─────────────────────────────────────────

class EvidenceRef(BaseModel):
    session_id: str
    issue_type: str
    signal: str             # the specific error/failure/anomaly


class Finding(BaseModel):
    issue: str              # what went wrong
    why: str                # root cause
    impact: str             # how often, how severe
    causal_chain: list[str] # e.g. ["Tool failed", "no retry", "fabricated response"]
    confidence: float       # 0.0-1.0
    related_pattern: str | None
    evidence: list[EvidenceRef]


class FixSuggestion(BaseModel):
    title: str
    description: str
    code_snippet: str | None
    type: Literal["prompt_fix", "retry_logic", "guardrail", "validation", "config_change"]
    confidence: float
    addresses: list[str]    # which Finding.issue(s) this fixes


class InspectorOutput(BaseModel):
    findings: list[Finding]     # max 5
    fixes: list[FixSuggestion]  # max 5
    summary: str                # 2-3 sentence executive summary
