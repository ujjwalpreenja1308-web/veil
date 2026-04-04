-- Inspector Runs table
-- Replaces the old inspectors, inspector_results, inspector_corrections tables.
-- Run this in the Supabase SQL editor BEFORE deploying new code.

create table if not exists inspector_runs (
  id                uuid primary key default gen_random_uuid(),
  org_id            text not null,
  agent_id          text not null,
  triggered_by      text not null,
  status            text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  sessions_analyzed int,
  findings          jsonb,
  patterns          jsonb,
  fixes             jsonb,
  summary           text,
  model             text,
  latency_ms        int,
  error             text,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index if not exists inspector_runs_org_agent_idx
  on inspector_runs (org_id, agent_id, created_at desc);

create index if not exists inspector_runs_org_status_idx
  on inspector_runs (org_id, status);

-- ─── Enable Realtime ─────────────────────────────────────────────────────────
-- Required for the frontend Supabase Realtime subscription on this table.

alter publication supabase_realtime add table inspector_runs;

-- ─── Drop old tables ─────────────────────────────────────────────────────────
-- Run this section ONLY after the new code is deployed and verified.
-- Order matters due to foreign key dependencies.

-- drop table if exists inspector_corrections;
-- drop table if exists inspector_results;
-- drop table if exists inspectors;
