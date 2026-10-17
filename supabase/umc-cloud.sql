-- Additive migration: does not delete or rewrite any existing leaderboard data.
begin;
create table if not exists public.umc_live_state (
  id text primary key,
  revision bigint not null default 0,
  state jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.umc_completed_runs (
  run_id uuid primary key,
  room text not null,
  state jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.umc_live_state enable row level security;
alter table public.umc_completed_runs enable row level security;
revoke all on public.umc_live_state, public.umc_completed_runs from public, anon, authenticated;
grant all on public.umc_live_state, public.umc_completed_runs to service_role;

create or replace function public.umc_commit_state(p_room text, p_revision bigint, p_state jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  current_revision bigint;
  inserted integer;
begin
  insert into public.umc_live_state(id) values (p_room) on conflict do nothing;
  select revision into current_revision from public.umc_live_state where id = p_room for update;
  if current_revision <> p_revision then return false; end if;
  if (p_state->>'revision')::bigint <= p_revision then
    raise exception 'Revision must increase';
  end if;
  if p_state->>'status' = 'finished' then
    insert into public.umc_completed_runs(run_id, room, state)
    values ((p_state->>'runId')::uuid, p_room, p_state) on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 1 and p_room = 'production' then
      insert into public."ABBOTT_QUIZ"(name, email, score, created_at)
      values (p_state->>'playerName', 'guest+' || (p_state->>'runId') || '@kiosk.invalid',
        (p_state->>'score')::integer, (p_state->>'completedAt')::timestamptz);
    end if;
    p_state := jsonb_set(p_state, '{resultSavedAt}', to_jsonb(now()));
  end if;
  update public.umc_live_state set revision = (p_state->>'revision')::bigint,
    state = p_state, updated_at = now() where id = p_room;
  return true;
end;
$$;
revoke all on function public.umc_commit_state(text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.umc_commit_state(text, bigint, jsonb) to service_role;
commit;
