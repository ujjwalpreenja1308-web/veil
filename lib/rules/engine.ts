// Failure classification engine
import type { FailureCategory } from "./categories";

export interface ClassificationResult {
  category: FailureCategory;
  subcategory: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
}

// Minimal shape the engine needs — accepts both NormalizedEvent and DB Event
interface ClassifiableEvent {
  type: string;
  payload: Record<string, unknown>;
}

// Cost thresholds (USD)
const COST_ANOMALY_HIGH = 1.0;
const COST_ANOMALY_CRITICAL = 5.0;

// Latency thresholds (ms)
const LATENCY_HIGH_MS = 10_000;
const LATENCY_CRITICAL_MS = 30_000;

// Loop detection — same tool called N+ times in a session
const LOOP_THRESHOLD = 5;

export function classify(events: ClassifiableEvent[]): ClassificationResult | null {
  if (!events.length) return null;

  // ── Context exhaustion ─────────────────────────────────────────────────────
  const contextError = events.find((e) => {
    const msg = String(e.payload["gen_ai.error.message"] ?? e.payload.error_message ?? "").toLowerCase();
    return (
      msg.includes("context length") ||
      msg.includes("maximum context") ||
      msg.includes("token limit") ||
      msg.includes("context window")
    );
  });
  if (contextError) {
    return {
      category: "context_exhaustion",
      subcategory: "token_limit_exceeded",
      severity: "high",
      reason: String(contextError.payload["gen_ai.error.message"] ?? contextError.payload.error_message ?? "Context length exceeded"),
    };
  }

  // ── Prompt injection ───────────────────────────────────────────────────────
  const injectionPatterns = [
    /ignore (previous|all|above) instructions/i,
    /you are now/i,
    /jailbreak/i,
    /system prompt/i,
    /forget (your|all) (instructions|training)/i,
  ];
  const injectionEvent = events.find((e) => {
    const prompt = String(e.payload["gen_ai.prompt"] ?? e.payload.input ?? "");
    return injectionPatterns.some((p) => p.test(prompt));
  });
  if (injectionEvent) {
    return {
      category: "prompt_injection",
      subcategory: "instruction_override_attempt",
      severity: "critical",
      reason: "Prompt injection pattern detected in input",
    };
  }

  // ── Tool failure ───────────────────────────────────────────────────────────
  const toolFailure = events.find((e) => {
    const type = e.type.toLowerCase();
    const hasError = e.payload.error || e.payload["gen_ai.error.message"];
    return (type.includes("tool") || type.includes("function_call")) && hasError;
  });
  if (toolFailure) {
    return {
      category: "tool_failure",
      subcategory: "tool_execution_error",
      severity: "medium",
      reason: String(toolFailure.payload["gen_ai.error.message"] ?? toolFailure.payload.error ?? "Tool execution failed"),
    };
  }

  // ── RAG failure ────────────────────────────────────────────────────────────
  const ragFailure = events.find((e) => {
    const type = e.type.toLowerCase();
    const hasError = e.payload.error || e.payload["gen_ai.error.message"];
    return (type.includes("retrieval") || type.includes("rag") || type.includes("vector")) && hasError;
  });
  if (ragFailure) {
    return {
      category: "rag_failure",
      subcategory: "retrieval_error",
      severity: "medium",
      reason: String(ragFailure.payload["gen_ai.error.message"] ?? ragFailure.payload.error ?? "RAG retrieval failed"),
    };
  }

  // ── Infinite loop ──────────────────────────────────────────────────────────
  const toolCalls = events.filter((e) => e.type.toLowerCase().includes("tool"));
  const toolCallCounts: Record<string, number> = {};
  for (const e of toolCalls) {
    const name = String(e.payload["gen_ai.tool.name"] ?? e.payload.tool_name ?? e.type);
    toolCallCounts[name] = (toolCallCounts[name] ?? 0) + 1;
  }
  const loopedTool = Object.entries(toolCallCounts).find(([, count]) => count >= LOOP_THRESHOLD);
  if (loopedTool) {
    return {
      category: "infinite_loop",
      subcategory: "repeated_tool_call",
      severity: "high",
      reason: `Tool "${loopedTool[0]}" called ${loopedTool[1]} times in a single session`,
    };
  }

  // ── Cost anomaly ───────────────────────────────────────────────────────────
  const totalCost = events.reduce((sum, e) => {
    return sum + Number(e.payload["gen_ai.usage.cost"] ?? e.payload.cost ?? 0);
  }, 0);
  if (totalCost >= COST_ANOMALY_CRITICAL) {
    return {
      category: "cost_anomaly",
      subcategory: "critical_cost_threshold",
      severity: "critical",
      reason: `Session cost $${totalCost.toFixed(4)} exceeded critical threshold ($${COST_ANOMALY_CRITICAL})`,
    };
  }
  if (totalCost >= COST_ANOMALY_HIGH) {
    return {
      category: "cost_anomaly",
      subcategory: "high_cost_threshold",
      severity: "high",
      reason: `Session cost $${totalCost.toFixed(4)} exceeded high threshold ($${COST_ANOMALY_HIGH})`,
    };
  }

  // ── Latency spike ──────────────────────────────────────────────────────────
  const slowEvent = events.find((e) => {
    const durationNs = Number(e.payload.duration_ns ?? 0);
    const durationMs = durationNs / 1_000_000;
    return durationMs >= LATENCY_HIGH_MS;
  });
  if (slowEvent) {
    const durationMs = Number(slowEvent.payload.duration_ns ?? 0) / 1_000_000;
    const severity = durationMs >= LATENCY_CRITICAL_MS ? "critical" : "high";
    return {
      category: "latency_spike",
      subcategory: "slow_span",
      severity,
      reason: `Span "${slowEvent.type}" took ${Math.round(durationMs)}ms`,
    };
  }

  // ── Silent failure ─────────────────────────────────────────────────────────
  const lastEvent = events[events.length - 1];
  const hasOutput = events.some((e) =>
    e.payload["gen_ai.completion"] || e.payload.output || e.payload.result
  );
  const hasError = events.some((e) => e.payload.error || e.payload["gen_ai.error.message"]);
  if (!hasOutput && !hasError && lastEvent.type !== "session.end") {
    return {
      category: "silent_failure",
      subcategory: "no_output_produced",
      severity: "medium",
      reason: "Session completed with no output and no explicit error",
    };
  }

  return null;
}
