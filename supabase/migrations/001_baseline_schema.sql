-- Baseline schema — captures the full core table structure
-- Run this against a fresh database. Idempotent (IF NOT EXISTS throughout).

-- ─── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ─── Organizations ─────────────────────────────────────────────────────────────
create table if not exists organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  api_key        text not null unique,
  clerk_user_id  text unique,
  created_at     timestamptz not null default now()
);

-- ─── Agents ────────────────────────────────────────────────────────────────────
create table if not exists agents (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

-- ─── Sessions ──────────────────────────────────────────────────────────────────
create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  agent_id     uuid not null references agents(id) on delete cascade,
  status       text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  failure_type text,
  cost         numeric(10, 6) default 0,
  duration_ms  int default 0,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── Events ────────────────────────────────────────────────────────────────────
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  step       int not null default 0,
  type       text not null,
  payload    jsonb not null default '{}',
  timestamp  timestamptz not null default now()
);

-- ─── Classifications ────────────────────────────────────────────────────────────
create table if not exists classifications (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references sessions(id) on delete cascade,
  category               text not null,
  subcategory            text not null,
  severity               text not null
    check (severity in ('low', 'medium', 'high', 'critical')),
  reason                 text not null,
  notes                  text,
  suggestion_applied     boolean not null default false,
  suggestion_applied_at  timestamptz,
  created_at             timestamptz not null default now()
);

-- ─── Fixes ─────────────────────────────────────────────────────────────────────
create table if not exists fixes (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,
  agent_id            uuid references agents(id) on delete set null,
  category            text not null,
  description         text not null,
  applied_at          timestamptz not null default now(),
  created_by_user_id  text,
  created_at          timestamptz not null default now()
);

-- ─── Error Logs ────────────────────────────────────────────────────────────────
create table if not exists error_logs (
  id         uuid primary key default gen_random_uuid(),
  route      text not null,
  message    text not null,
  stack      text,
  context    jsonb,
  org_id     uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Inspector Runs ────────────────────────────────────────────────────────────
create table if not exists inspector_runs (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  agent_id          uuid not null references agents(id) on delete cascade,
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

-- ─── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table inspector_runs;
