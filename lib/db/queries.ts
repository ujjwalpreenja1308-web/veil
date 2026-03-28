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

export async function getClassificationsByOrg(orgId: string, limit = 100): Promise<ClassificationWithSession[]> {
  const { data, error } = await supabase
    .from("classifications")
    .select("*, session:sessions!inner(id, org_id, agent_id, started_at, failure_type, status)")
    .eq("session.org_id", orgId)
    .order("session(started_at)", { ascending: false })
    .limit(limit);
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

// ─── Classification Updates ───────────────────────────────────────────────────

export async function updateClassification(
  classificationId: string,
  updates: {
    notes?: string | null;
    suggestion_applied?: boolean;
    suggestion_applied_at?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("classifications")
    .update(updates)
    .eq("id", classificationId);
  if (error) throw error;
}

// ─── Failure Patterns ─────────────────────────────────────────────────────────

export interface FailurePattern {
  agentId: string;
  agentName: string;
  category: string;
  count: number;
  subcategories: { subcategory: string; count: number }[];
  firstSeen: string;
  lastSeen: string;
  severity: "low" | "medium" | "high" | "critical";
}

export async function getFailurePatterns(
  orgId: string,
  windowDays = 7,
  minCount = 5
): Promise<FailurePattern[]> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  // Fetch classifications in window joined to sessions and agents
  const { data, error } = await supabase
    .from("classifications")
    .select(`
      id,
      category,
      subcategory,
      severity,
      created_at,
      session:sessions!inner(id, org_id, agent_id, agent:agents!inner(id, name))
    `)
    .eq("session.org_id", orgId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Group by (agent_id, category)
  const groups = new Map<
    string,
    {
      agentId: string;
      agentName: string;
      category: string;
      severity: string;
      rows: { subcategory: string; created_at: string }[];
    }
  >();

  for (const row of data ?? []) {
    const s = row.session as unknown as {
      org_id: string;
      agent_id: string;
      agent: { id: string; name: string };
    };
    const key = `${s.agent_id}::${row.category}`;
    if (!groups.has(key)) {
      groups.set(key, {
        agentId: s.agent_id,
        agentName: s.agent.name,
        category: row.category,
        severity: row.severity,
        rows: [],
      });
    }
    groups.get(key)!.rows.push({ subcategory: row.subcategory, created_at: String(row.created_at) });
  }

  const patterns: FailurePattern[] = [];

  for (const g of groups.values()) {
    if (g.rows.length < minCount) continue;

    // Count subcategories
    const subCounts: Record<string, number> = {};
    for (const r of g.rows) {
      subCounts[r.subcategory] = (subCounts[r.subcategory] ?? 0) + 1;
    }
    const subcategories = Object.entries(subCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([subcategory, count]) => ({ subcategory, count }));

    const timestamps = g.rows.map((r) => r.created_at).sort();

    patterns.push({
      agentId: g.agentId,
      agentName: g.agentName,
      category: g.category,
      count: g.rows.length,
      subcategories,
      firstSeen: timestamps[0],
      lastSeen: timestamps[timestamps.length - 1],
      severity: g.severity as FailurePattern["severity"],
    });
  }

  return patterns.sort((a, b) => b.count - a.count);
}

// ─── Fixes ────────────────────────────────────────────────────────────────────

import type { Fix } from "./schema";

export async function createFix(
  orgId: string,
  params: {
    agent_id?: string;
    category: string;
    description: string;
    applied_at?: string;
    created_by_user_id?: string;
  }
): Promise<Fix> {
  const { data, error } = await supabase
    .from("fixes")
    .insert({ org_id: orgId, ...params })
    .select()
    .single();
  if (error) throw error;
  return data as Fix;
}

export async function getFixesByOrg(orgId: string): Promise<Fix[]> {
  const { data, error } = await supabase
    .from("fixes")
    .select("*")
    .eq("org_id", orgId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Fix[];
}

export async function deleteFix(orgId: string, fixId: string): Promise<void> {
  const { error } = await supabase
    .from("fixes")
    .delete()
    .eq("org_id", orgId)
    .eq("id", fixId);
  if (error) throw error;
}

export interface FixImpact {
  fix: Fix;
  category: string;
  beforeCount: number;
  afterCount: number;
  beforeDays: number;
  afterDays: number;
  deltaPercent: number | null;
}

export async function getFixImpact(orgId: string, fixId: string): Promise<FixImpact | null> {
  // Get the fix
  const { data: fixData, error: fixErr } = await supabase
    .from("fixes")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", fixId)
    .single();
  if (fixErr || !fixData) return null;

  const fix = fixData as Fix;
  const appliedAt = new Date(fix.applied_at);
  const windowMs = 14 * 24 * 60 * 60 * 1000; // 14-day comparison window
  const beforeStart = new Date(appliedAt.getTime() - windowMs).toISOString();
  const afterEnd = new Date().toISOString();

  // Count failures before fix
  const beforeQuery = supabase
    .from("classifications")
    .select("id, session:sessions!inner(org_id, agent_id)", { count: "exact", head: true })
    .eq("session.org_id", orgId)
    .eq("category", fix.category)
    .gte("created_at", beforeStart)
    .lt("created_at", fix.applied_at.toISOString());

  if (fix.agent_id) beforeQuery.eq("session.agent_id", fix.agent_id);

  const afterQuery = supabase
    .from("classifications")
    .select("id, session:sessions!inner(org_id, agent_id)", { count: "exact", head: true })
    .eq("session.org_id", orgId)
    .eq("category", fix.category)
    .gte("created_at", fix.applied_at.toISOString())
    .lte("created_at", afterEnd);

  if (fix.agent_id) afterQuery.eq("session.agent_id", fix.agent_id);

  const [beforeRes, afterRes] = await Promise.all([beforeQuery, afterQuery]);

  const beforeCount = beforeRes.count ?? 0;
  const afterCount = afterRes.count ?? 0;
  const afterDays = Math.max(
    1,
    Math.round((Date.now() - appliedAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Normalise counts to "per day" before computing delta
  const beforePerDay = beforeCount / 14;
  const afterPerDay = afterCount / afterDays;
  const deltaPercent =
    beforePerDay > 0
      ? Math.round(((afterPerDay - beforePerDay) / beforePerDay) * 100)
      : null;

  return {
    fix,
    category: fix.category,
    beforeCount,
    afterCount,
    beforeDays: 14,
    afterDays,
    deltaPercent,
  };
}
