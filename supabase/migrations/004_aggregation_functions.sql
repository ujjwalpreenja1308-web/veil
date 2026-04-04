-- SQL functions for aggregations that were previously done in JavaScript.
-- Moves work to the database layer where indexes can be leveraged.

-- ─── Overview stats (today's sessions, failures, cost) ─────────────────────────
create or replace function get_overview_stats(p_org_id uuid)
returns table (
  total_agents   bigint,
  sessions_today bigint,
  failures_today bigint,
  cost_today     numeric
)
language sql
stable
as $$
  select
    (select count(*) from agents where org_id = p_org_id)                        as total_agents,
    count(*)                                                                       as sessions_today,
    count(*) filter (where status = 'failed')                                      as failures_today,
    coalesce(sum(cost), 0)                                                         as cost_today
  from sessions
  where org_id = p_org_id
    and started_at >= date_trunc('day', now() at time zone 'utc');
$$;

-- ─── Cost by day ───────────────────────────────────────────────────────────────
create or replace function get_cost_by_day(p_org_id uuid, p_days int)
returns table (
  date     text,
  cost     numeric,
  sessions bigint
)
language sql
stable
as $$
  select
    to_char(date_trunc('day', started_at at time zone 'utc'), 'YYYY-MM-DD') as date,
    coalesce(sum(cost), 0)                                                   as cost,
    count(*)                                                                  as sessions
  from sessions
  where org_id = p_org_id
    and started_at >= now() - make_interval(days => p_days)
  group by date_trunc('day', started_at at time zone 'utc')
  order by 1 asc;
$$;

-- ─── Agent health summary ──────────────────────────────────────────────────────
create or replace function get_agents_with_health(p_org_id uuid)
returns table (
  id                   uuid,
  org_id               uuid,
  name                 text,
  created_at           timestamptz,
  last_session_status  text,
  session_count        bigint,
  failure_count        bigint
)
language sql
stable
as $$
  select
    a.id,
    a.org_id,
    a.name,
    a.created_at,
    (
      select s.status
      from sessions s
      where s.agent_id = a.id
        and s.org_id = p_org_id
      order by s.started_at desc
      limit 1
    )                                                                                         as last_session_status,
    count(s.id)                                                                               as session_count,
    count(s.id) filter (where s.status = 'failed')                                            as failure_count
  from agents a
  left join sessions s on s.agent_id = a.id and s.org_id = p_org_id
  where a.org_id = p_org_id
  group by a.id, a.org_id, a.name, a.created_at
  order by a.created_at desc;
$$;
