-- Append-only source snapshots and advisor review records. No UPDATE/DELETE grants.
create table if not exists public.kyp_review_archive (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  kind text not null check (kind in ('research', 'audit')),
  document text not null check (length(document) <= 100000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index if not exists kyp_review_archive_owner_created on public.kyp_review_archive(owner_id, created_at desc);
alter table public.kyp_review_archive enable row level security;
revoke all on public.kyp_review_archive from anon, authenticated;
grant select on public.kyp_review_archive to authenticated;
create policy kyp_review_archive_select on public.kyp_review_archive for select to authenticated using (owner_id = auth.uid());
create or replace function public.reject_kyp_archive_mutation() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'KYP archive records are append-only. Create a new review to correct an earlier record.'; end;
$$;
create trigger kyp_review_archive_no_mutation before update or delete on public.kyp_review_archive for each row execute function public.reject_kyp_archive_mutation();
comment on table public.kyp_review_archive is 'Append-only KYP evidence. Retention, legal sufficiency and dealer supervision remain firm responsibilities.';
