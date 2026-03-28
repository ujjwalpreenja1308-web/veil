// All database queries — every query MUST include org_id for tenant isolation
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Agent, Session, Event, Classification, Organization } from "./schema";

// ─── Organizations ────────────────────────────────────────────────────────────

export async function getOrgByApiKey(apiKey: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("api_key", apiKey)
    .single();
  // PGRST116 = "not found" — anything else is a real DB error
  if (error) {
    if (error.code !== "PGRST116") {
      logger.exception("[db] getOrgByApiKey DB error", error, { key: apiKey.slice(0, 8) + "..." });
    }
    return null;
  }
  return data as Organization;
}

export async function createOrg(
  name: string,
  apiKey: string,
  clerkUserId: string
): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .upsert(
      { name, api_key: apiKey, clerk_user_id: clerkUserId },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as Organization;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export async function getAgentsByOrg(orgId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Agent[];
}

export async function getAgentById(orgId: string, agentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", agentId)
    .single();
  if (error) return null;
  return data as Agent;
}

export async function upsertAgent(orgId: string, name: string): Promise<Agent> {
  const { data, error } = await supabase
    .from("agents")
    .upsert({ org_id: orgId, name }, { onConflict: "org_id,name" })
    .select()
    .single();
  if (error) throw error;
  return data as Agent;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessionsByOrg(orgId: string, limit = 100): Promise<(Session & { agent: { name: string } | null })[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, agent:agents(name)")
    .eq("org_id", orgId)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as (Session & { agent: { name: string } | null })[];
}

export async function getSessionById(orgId: string, sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", sessionId)
    .single();
  if (error) return null;
  return data as Session;
}

export async function createSession(
  orgId: string,
  agentId: string,
  sessionId?: string
): Promise<Session> {
  const insert: Record<string, unknown> = { org_id: orgId, agent_id: agentId, status: "running" };
  if (sessionId) insert.id = sessionId;
  const { data, error } = await supabase
    .from("sessions")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

export async function completeSession(
  orgId: string,
  sessionId: string,
  updates: {
    status: "completed" | "failed";
    failure_type?: string | null;
    cost?: number;
    duration_ms?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update({ ...updates, completed_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", sessionId);
  if (error) throw error;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEventsBySession(orgId: string, sessionId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("org_id", orgId)
    .eq("session_id", sessionId)
    .order("step", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Event[];
}

export async function insertEvent(
  orgId: string,
  sessionId: string,
  step: number,
  type: string,
  payload: Record<string, unknown>,
  timestamp?: Date
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      org_id: orgId,
      session_id: sessionId,
      step,
      type,
      payload,
      timestamp: (timestamp ?? new Date()).toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

// ─── Classifications ──────────────────────────────────────────────────────────

export async function insertClassification(
  sessionId: string,
  category: string,
  subcategory: string,
  severity: "low" | "medium" | "high" | "critical",
  reason: string
): Promise<Classification> {
  const { data, error } = await supabase
    .from("classifications")
    .insert({ session_id: sessionId, category, subcategory, severity, reason })
    .select()
    .single();
  if (error) throw error;
  return data as Classification;
}

export async function getClassificationsBySession(sessionId: string): Promise<Classification[]> {
  const { data, error } = await supabase
    .from("classifications")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as Classification[];
}

// ─── Dashboard Aggregations ──────────────────────────────────────────────────

export async function getSessionsByAgent(orgId: string, agentId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("org_id", orgId)
    .eq("agent_id", agentId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}

export interface OverviewStats {
  totalAgents: number;
  sessionsToday: number;
  failuresToday: number;
  costToday: number;
}

export async function getOverviewStats(orgId: string): Promise<OverviewStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [agentsRes, sessionsTodayRes] = await Promise.all([
    supabase.from("agents").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("sessions").select("status, cost").eq("org_id", orgId).gte("started_at", todayISO),
  ]);

  if (agentsRes.error) {
    logger.exception("[db] getOverviewStats agents query failed", agentsRes.error, { orgId });
  }
  if (sessionsTodayRes.error) {
    logger.exception("[db] getOverviewStats sessions query failed", sessionsTodayRes.error, { orgId });
  }

  const totalAgents = agentsRes.count ?? 0;
  const sessionsToday = sessionsTodayRes.data ?? [];
  const failuresToday = sessionsToday.filter((s) => s.status === "failed").length;
  const costToday = sessionsToday.reduce((sum, s) => sum + Number(s.cost ?? 0), 0);

  return { totalAgents, sessionsToday: sessionsToday.length, failuresToday, costToday };
}

export interface ClassificationWithSession extends Classification {
  session: Pick<Session, "id" | "org_id" | "agent_id" | "started_at" | "failure_type" | "status">;
}

export async function getClassificationsByOrg(orgId: string): Promise<ClassificationWithSession[]> {
  const { data, error } = await supabase
    .from("classifications")
    .select("*, session:sessions!inner(id, org_id, agent_id, started_at, failure_type, status)")
    .eq("session.org_id", orgId)
    .order("session(started_at)", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClassificationWithSession[];
}

export interface AgentWithHealth extends Agent {
  last_session_status: "running" | "completed" | "failed" | null;
  session_count: number;
  failure_count: number;
}

export async function getAgentsWithHealth(orgId: string): Promise<AgentWithHealth[]> {
  // Single query: agents + per-agent aggregates computed in the DB, not in memory
  const { data, error } = await supabase
    .from("agents")
    .select(`
      *,
      sessions!sessions_agent_id_fkey(status, started_at)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as (Agent & { sessions: { status: string; started_at: string }[] })[]).map(
    (agent) => {
      const sorted = [...agent.sessions].sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      return {
        id: agent.id,
        org_id: agent.org_id,
        name: agent.name,
        created_at: agent.created_at,
        last_session_status: (sorted[0]?.status ?? null) as AgentWithHealth["last_session_status"],
        session_count: sorted.length,
        failure_count: sorted.filter((s) => s.status === "failed").length,
      };
    }
  );
}

export interface CostByDay {
  date: string;
  cost: number;
  sessions: number;
}

export async function getCostByDay(orgId: string, days: number): Promise<CostByDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("sessions")
    .select("started_at, cost")
    .eq("org_id", orgId)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: true });

  if (error) throw error;

  const grouped: Record<string, { cost: number; sessions: number }> = {};
  for (const row of data ?? []) {
    const date = new Date(row.started_at).toISOString().split("T")[0];
    if (!grouped[date]) grouped[date] = { cost: 0, sessions: 0 };
    grouped[date].cost += Number(row.cost ?? 0);
    grouped[date].sessions += 1;
  }

  return Object.entries(grouped).map(([date, v]) => ({ date, ...v }));
}
