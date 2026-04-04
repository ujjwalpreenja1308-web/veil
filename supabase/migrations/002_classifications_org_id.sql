-- Add org_id to classifications for proper tenant isolation.
-- Every classification must be directly scoped to an org so queries
-- don't have to join through sessions to enforce tenant boundaries.

-- Step 1: Add nullable column first (existing rows have no org_id yet)
alter table classifications
  add column if not exists org_id uuid references organizations(id) on delete cascade;

-- Step 2: Delete orphaned classifications whose session no longer exists
-- (can't backfill org_id for them, and they're unreachable anyway)
delete from classifications
where session_id not in (select id from sessions);

-- Step 3: Backfill from sessions join
update classifications c
set org_id = s.org_id
from sessions s
where c.session_id = s.id
  and c.org_id is null;

-- Step 4: Make it NOT NULL now that all rows are backfilled
alter table classifications
  alter column org_id set not null;

-- ─── RLS Policies ──────────────────────────────────────────────────────────────
-- Defense-in-depth: even though the app uses the service role key (which bypasses
-- RLS), these policies protect against key leaks or direct DB access.
-- CREATE POLICY does not support IF NOT EXISTS — use DO blocks to skip if already present.

alter table organizations    enable row level security;
alter table agents           enable row level security;
alter table sessions         enable row level security;
alter table events           enable row level security;
alter table classifications  enable row level security;
alter table fixes            enable row level security;
alter table inspector_runs   enable row level security;

-- Service role bypasses RLS entirely — no policy needed for it.
-- These policies apply to the anon / authenticated roles only.

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_organizations' and tablename = 'organizations') then
    execute $p$
      create policy "org_isolation_organizations"
        on organizations for all
        using (id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_agents' and tablename = 'agents') then
    execute $p$
      create policy "org_isolation_agents"
        on agents for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_sessions' and tablename = 'sessions') then
    execute $p$
      create policy "org_isolation_sessions"
        on sessions for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_events' and tablename = 'events') then
    execute $p$
      create policy "org_isolation_events"
        on events for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_classifications' and tablename = 'classifications') then
    execute $p$
      create policy "org_isolation_classifications"
        on classifications for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_fixes' and tablename = 'fixes') then
    execute $p$
      create policy "org_isolation_fixes"
        on fixes for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'org_isolation_inspector_runs' and tablename = 'inspector_runs') then
    execute $p$
      create policy "org_isolation_inspector_runs"
        on inspector_runs for all
        using (org_id = current_setting('app.current_org_id', true)::uuid)
    $p$;
  end if;
end $$;
