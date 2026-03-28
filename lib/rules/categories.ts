export type FailureCategory =
  | "context_exhaustion"
  | "rag_failure"
  | "cost_anomaly"
  | "tool_failure"
  | "infinite_loop"
  | "goal_drift"
  | "prompt_injection"
  | "hallucination"
  | "latency_spike"
  | "silent_failure";

export const FAILURE_CATEGORIES: Record<FailureCategory, string> = {
  context_exhaustion: "Context Exhaustion",
  rag_failure: "RAG Failure",
  cost_anomaly: "Cost Anomaly",
  tool_failure: "Tool Failure",
  infinite_loop: "Infinite Loop",
  goal_drift: "Goal Drift",
  prompt_injection: "Prompt Injection",
  hallucination: "Hallucination",
  latency_spike: "Latency Spike",
  silent_failure: "Silent Failure",
};
