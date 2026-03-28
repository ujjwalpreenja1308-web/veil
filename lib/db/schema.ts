// Database schema types — all queries must be scoped by org_id

export interface Organization {
  id: string;
  name: string;
  api_key: string;
  clerk_user_id: string | null;
  created_at: Date;
}

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  created_at: Date;
}

export interface Session {
  id: string;
  org_id: string;
  agent_id: string;
  status: "running" | "completed" | "failed";
  failure_type: string | null;
  cost: number;
  duration_ms: number;
  started_at: Date;
  completed_at: Date | null;
}

export interface Event {
  id: string;
  session_id: string;
  org_id: string;
  step: number;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export interface Classification {
  id: string;
  session_id: string;
  category: string;
  subcategory: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  created_at: Date;
  notes: string | null;
  suggestion_applied: boolean;
  suggestion_applied_at: Date | null;
}

export interface Fix {
  id: string;
  org_id: string;
  agent_id: string | null;
  category: string;
  description: string;
  applied_at: Date;
  created_by_user_id: string | null;
  created_at: Date;
}
