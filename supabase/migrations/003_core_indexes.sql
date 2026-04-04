-- Core indexes for hot-path queries.
-- Every ingest request hits organizations.api_key — that must be indexed.
-- All other indexes are derived from query patterns in lib/db/queries.ts.

-- ─── Organizations ─────────────────────────────────────────────────────────────
-- Hot path: getOrgByApiKey — called on every ingest request
create unique index if not exists idx_organizations_api_key
  on organizations (api_key);

-- Used by Clerk webhook upsert
create index if not exists idx_organizations_clerk_user
  on organizations (clerk_user_id);

-- ─── Agents ────────────────────────────────────────────────────────────────────
-- getAgentsByOrg, getAgentsWithHealth, upsertAgent
create index if not exists idx_agents_org
  on agents (org_id, created_at desc);

-- ─── Sessions ──────────────────────────────────────────────────────────────────
-- getSessionsByOrg, getOverviewStats, getCostByDay
create index if not exists idx_sessions_org_started
  on sessions (org_id, started_at desc);

-- getSessionsByAgent
create index if not exists idx_sessions_org_agent
  on sessions (org_id, agent_id, started_at desc);

-- expireOrphanedSessions — partial index, very selective
create index if not exists idx_sessions_running
  on sessions (started_at) where status = 'running';

-- ─── Events ────────────────────────────────────────────────────────────────────
-- getEventsBySession, getSessionEventCount
create index if not exists idx_events_org_session
  on events (org_id, session_id, step asc);

-- ─── Classifications ────────────────────────────────────────────────────────────
-- getClassificationsBySession (now org-scoped)
create index if not exists idx_classifications_org_session
  on classifications (org_id, session_id);

-- getClassificationsByOrg, getFailurePatterns
create index if not exists idx_classifications_org_created
  on classifications (org_id, created_at desc);

-- ─── Fixes ─────────────────────────────────────────────────────────────────────
-- getFixesByOrg, getFixImpact
create index if not exists idx_fixes_org
  on fixes (org_id, applied_at desc);

-- ─── Inspector Runs ────────────────────────────────────────────────────────────
-- getInspectorRunsByOrg
create index if not exists idx_inspector_runs_org_agent
  on inspector_runs (org_id, agent_id, created_at desc);

create index if not exists idx_inspector_runs_org_status
  on inspector_runs (org_id, status);

-- ─── Error Logs ────────────────────────────────────────────────────────────────
create index if not exists idx_error_logs_created
  on error_logs (created_at desc);

create index if not exists idx_error_logs_org
  on error_logs (org_id) where org_id is not null;

-- ─── Auto-cleanup ──────────────────────────────────────────────────────────────
-- Delete error logs older than 30 days. Unschedule first to avoid duplicate-name
-- error if migration_error_logs.sql was previously run against this database.
do $$
begin
  perform cron.unschedule('delete-old-error-logs');
exception when others then
  null; -- job didn't exist, nothing to do
end $$;

select cron.schedule(
  'delete-old-error-logs',
  '0 3 * * *',
  $$delete from error_logs where created_at < now() - interval '30 days'$$
);
