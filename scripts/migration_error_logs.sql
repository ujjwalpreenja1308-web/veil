-- Error logs table for internal observability
-- Run this in Supabase SQL editor

create table if not exists error_logs (
  id          uuid primary key default gen_random_uuid(),
  route       text not null,
  message     text not null,
  stack       text,
  context     jsonb,
  org_id      uuid references organizations(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Index for dashboard queries (most recent first, filter by route)
create index if not exists error_logs_created_at_idx on error_logs (created_at desc);
create index if not exists error_logs_route_idx on error_logs (route);
create index if not exists error_logs_org_id_idx on error_logs (org_id) where org_id is not null;

-- Auto-delete logs older than 30 days (keep table lean)
select cron.schedule(
  'delete-old-error-logs',
  '0 3 * * *',
  $$delete from error_logs where created_at < now() - interval '30 days'$$
);
