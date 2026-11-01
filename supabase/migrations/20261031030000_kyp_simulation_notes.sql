-- Simulations and writing patterns are working drafts, separate from compliance archives.
create table public.kyp_simulation_runs (
 id uuid primary key, owner_id uuid not null references auth.users(id), document jsonb not null,
 version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index kyp_simulation_runs_owner_created on public.kyp_simulation_runs(owner_id,created_at desc);
alter table public.kyp_simulation_runs enable row level security;
revoke all on public.kyp_simulation_runs from anon,authenticated;
grant select on public.kyp_simulation_runs to authenticated;
create policy kyp_simulation_runs_owner_select on public.kyp_simulation_runs for select to authenticated using(owner_id=auth.uid());
create table public.kyp_note_patterns (
 id uuid primary key, owner_id uuid not null references auth.users(id), document jsonb not null,
 version integer not null default 1, created_at timestamptz not null default now()
);
create index kyp_note_patterns_owner_created on public.kyp_note_patterns(owner_id,created_at desc);
alter table public.kyp_note_patterns enable row level security;
revoke all on public.kyp_note_patterns from anon,authenticated;
grant select on public.kyp_note_patterns to authenticated;
create policy kyp_note_patterns_owner_select on public.kyp_note_patterns for select to authenticated using(owner_id=auth.uid());
