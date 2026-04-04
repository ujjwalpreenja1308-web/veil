// n8n webhook normalizer
// Translates n8n's native execution webhook payload into Veil NormalizedEvents.
//
// n8n sends a webhook on workflow execution with this shape:
// {
//   "execution": {
//     "id": "abc123",
//     "workflowId": "wf_001",
//     "workflowName": "My AI Agent",
//     "status": "success" | "error" | "running",
//     "startedAt": "2024-01-01T00:00:00.000Z",
//     "stoppedAt": "2024-01-01T00:00:05.000Z",
//     "mode": "webhook" | "manual" | "trigger",
//     "data": {
//       "resultData": {
//         "runData": {
//           "<NodeName>": [{ "executionTime": 123, "data": { "main": [[{ "json": {} }]] } }]
//         },
//         "error": { "message": "..." }   // only on error
//       }
//     }
//   }
// }
//
// Each node execution becomes one Veil event; a synthetic session.end is appended.

import type { NormalizedEvent } from "./index";

interface N8nNodeRun {
  executionTime?: number;
  startTime?: number;
  data?: {
    main?: Array<Array<{ json?: Record<string, unknown> }>>;
  };
  error?: { message?: string };
}

interface N8nRunData {
  [nodeName: string]: N8nNodeRun[];
}

interface N8nExecution {
  id?: string;
  workflowId?: string;
  workflowName?: string;
  status?: "success" | "error" | "running" | "waiting";
  startedAt?: string;
  stoppedAt?: string;
  mode?: string;
  data?: {
    resultData?: {
      runData?: N8nRunData;
      error?: { message?: string };
    };
  };
}

export interface N8nWebhookPayload {
  execution?: N8nExecution;
  // n8n also supports top-level fields when using "Respond to Webhook" node
  [key: string]: unknown;
}

// Classify a node name into a Veil event type
function nodeToEventType(nodeName: string): string {
  const lower = nodeName.toLowerCase();
  if (lower.includes("openai") || lower.includes("gpt") || lower.includes("anthropic") || lower.includes("claude") || lower.includes("llm") || lower.includes("ai agent") || lower.includes("chat model")) {
    return "llm.call";
  }
  if (lower.includes("tool") || lower.includes("function") || lower.includes("code")) {
    return "tool.call";
  }
  if (lower.includes("retriev") || lower.includes("vector") || lower.includes("embed") || lower.includes("pinecone") || lower.includes("supabase") || lower.includes("rag")) {
    return "retrieval";
  }
  if (lower.includes("http") || lower.includes("webhook") || lower.includes("request")) {
    return "tool.call";
  }
  return "span";
}

// Extract LLM-specific fields from an n8n node's output JSON
function extractLlmFields(json: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // Common n8n OpenAI/LLM node output shapes
  const text = json.text ?? json.content ?? json.response ?? json.output ?? json.message;
  if (text) out["gen_ai.completion"] = String(text);

  const input = json.input ?? json.prompt ?? json.query ?? json.question;
  if (input) out["gen_ai.prompt"] = String(input);

  // Token usage (OpenAI node exposes these)
  const usage = json.usage as Record<string, unknown> | undefined;
  if (usage) {
    if (usage.prompt_tokens != null) out["gen_ai.usage.prompt_tokens"] = Number(usage.prompt_tokens);
    if (usage.completion_tokens != null) out["gen_ai.usage.completion_tokens"] = Number(usage.completion_tokens);
    if (usage.total_tokens != null) out["gen_ai.usage.total_tokens"] = Number(usage.total_tokens);
  }

  // Model
  const model = json.model ?? json.modelId ?? json.model_id;
  if (model) out["gen_ai.request.model"] = String(model);

  // Error
  const error = json.error ?? json.error_message;
  if (error) out["gen_ai.error.message"] = String(error);

  return out;
}

export function normalizeN8n(raw: unknown): NormalizedEvent[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw Object.assign(new Error("n8n payload must be a JSON object"), { status: 422 });
  }

  const body = raw as N8nWebhookPayload;
  const exec = body.execution;

  if (!exec) {
    throw Object.assign(
      new Error("n8n payload missing 'execution' field. Enable 'Include Execution Data' in your n8n webhook node."),
      { status: 422 }
    );
  }

  // Session ID: use execution id, fall back to workflowId + timestamp
  const sessionId = String(
    exec.id ?? `${exec.workflowId ?? "wf"}-${Date.now()}`
  );

  const agentName = exec.workflowName ?? exec.workflowId ?? "n8n-workflow";
  const sessionStart = exec.startedAt ? new Date(exec.startedAt) : new Date();
  const sessionEnd = exec.stoppedAt ? new Date(exec.stoppedAt) : new Date();
  const isError = exec.status === "error";

  const events: NormalizedEvent[] = [];
  let step = 1;

  const runData = exec.data?.resultData?.runData ?? {};

  for (const [nodeName, nodeRuns] of Object.entries(runData)) {
    for (const run of nodeRuns) {
      const nodeStartMs = run.startTime ?? sessionStart.getTime();
      const durationMs = run.executionTime ?? 0;
      const timestamp = new Date(nodeStartMs);
      const eventType = nodeToEventType(nodeName);

      // Pull the first output item's JSON for field extraction
      const firstOutput = run.data?.main?.[0]?.[0]?.json ?? {};
      const llmFields = extractLlmFields(firstOutput);

      const payload: Record<string, unknown> = {
        agent_name: agentName,
        "n8n.node.name": nodeName,
        "n8n.execution.id": exec.id,
        "n8n.workflow.id": exec.workflowId,
        duration_ns: durationMs * 1_000_000,
        ...llmFields,
      };

      // Surface node-level errors
      if (run.error?.message) {
        payload["gen_ai.error.message"] = run.error.message;
      }

      events.push({ sessionId, orgId: "", step, type: eventType, payload, timestamp });
      step++;
    }
  }

  // If no run data was present, push a minimal span so session always has at least one event
  if (events.length === 0) {
    events.push({
      sessionId,
      orgId: "",
      step: 1,
      type: "span",
      payload: {
        agent_name: agentName,
        "n8n.execution.id": exec.id,
        "n8n.workflow.id": exec.workflowId,
        "n8n.execution.mode": exec.mode,
      },
      timestamp: sessionStart,
    });
    step = 2;
  }

  // Append top-level error if execution failed
  if (isError && exec.data?.resultData?.error?.message) {
    events.push({
      sessionId,
      orgId: "",
      step,
      type: "span",
      payload: {
        agent_name: agentName,
        "gen_ai.error.message": exec.data.resultData.error.message,
        "n8n.execution.id": exec.id,
      },
      timestamp: sessionEnd,
    });
    step++;
  }

  // Always append session.end
  const totalDurationMs = sessionEnd.getTime() - sessionStart.getTime();
  events.push({
    sessionId,
    orgId: "",
    step,
    type: "session.end",
    payload: {
      agent_name: agentName,
      "n8n.execution.status": exec.status,
      "n8n.execution.mode": exec.mode,
      "n8n.workflow.id": exec.workflowId,
      duration_ns: totalDurationMs * 1_000_000,
    },
    timestamp: sessionEnd,
  });

  return events;
}
