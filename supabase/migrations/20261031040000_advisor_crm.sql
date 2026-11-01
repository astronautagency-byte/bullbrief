begin;
-- First CRM release: firm-scoped households, contacts, meetings, tasks and KYP references.
create table public.crm_firms (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120),
 is_demo boolean not null default false, timezone text not null default 'America/Toronto', created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.crm_members (
 firm_id uuid not null references public.crm_firms(id), user_id uuid not null references auth.users(id),
 name text not null, email text not null, role text not null check(role in ('owner','admin','advisor','staff','supervisor')),
 status text not null default 'active' check(status in ('active','disabled')), created_at timestamptz not null default now(), primary key(firm_id,user_id)
);
create table public.crm_households (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null references public.crm_firms(id), name text not null check(length(name) between 2 and 150),
 stage text not null default 'prospect' check(stage in ('prospect','onboarding','active','inactive')), service_tier text not null default 'Core' check(length(service_tier)<=80),
 lead_advisor_id uuid not null, review_due date, summary text not null default '' check(length(summary)<=4000), is_demo boolean not null default false,
 version integer not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(firm_id,id), foreign key(firm_id,lead_advisor_id) references public.crm_members(firm_id,user_id)
);
create table public.crm_household_team (
 firm_id uuid not null, household_id uuid not null, user_id uuid not null,
 primary key(firm_id,household_id,user_id), foreign key(firm_id,household_id) references public.crm_households(firm_id,id), foreign key(firm_id,user_id) references public.crm_members(firm_id,user_id)
);
create table public.crm_contacts (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null, household_id uuid not null,
 first_name text not null check(length(first_name) between 1 and 100), last_name text not null default '' check(length(last_name)<=100),
 relationship text not null default 'Primary contact' check(length(relationship)<=80), email text not null default '' check(length(email)<=254), phone text not null default '' check(length(phone)<=60),
 version integer not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id)
);
create table public.crm_meetings (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null, household_id uuid not null,
 title text not null check(length(title) between 2 and 180), occurred_at timestamptz not null, attendees text not null default '' check(length(attendees)<=1500),
 discussion text not null check(length(discussion) between 10 and 15000), decisions text not null default '' check(length(decisions)<=8000),
 status text not null default 'draft' check(status in ('draft','final')), supersedes_id uuid references public.crm_meetings(id), finalized_by uuid references auth.users(id), finalized_at timestamptz,
 version integer not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id)
);
create table public.crm_tasks (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null, household_id uuid not null, meeting_id uuid references public.crm_meetings(id),
 title text not null check(length(title) between 2 and 200), details text not null default '' check(length(details)<=5000), assigned_to uuid not null,
 due_on date, priority text not null default 'normal' check(priority in ('normal','high','low')), status text not null default 'open' check(status in ('open','in_progress','done','cancelled')), completed_at timestamptz,
 version integer not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id), foreign key(firm_id,assigned_to) references public.crm_members(firm_id,user_id)
);
create table public.crm_kyp_reviews (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null, household_id uuid not null,
 source_kind text not null check(source_kind in ('simulation','archive')), source_id uuid not null, holding_id text,
 product_name text not null, identifier text not null, source_metadata jsonb not null,
 review_status text not null default 'open' check(review_status in ('open','needs_evidence','review_requested','reviewed')),
 review_notes text not null default '' check(length(review_notes)<=6000), assigned_to uuid not null, due_on date, reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 version integer not null default 1, created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id), foreign key(firm_id,assigned_to) references public.crm_members(firm_id,user_id)
);
create table public.crm_invites (
 id uuid primary key default gen_random_uuid(), firm_id uuid not null references public.crm_firms(id), email text not null,
 role text not null check(role in ('admin','advisor','staff','supervisor')), token_hash text not null unique, expires_at timestamptz not null default now()+interval '7 days',
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), used_at timestamptz, used_by uuid references auth.users(id)
);
create table public.crm_audit_events (
 id bigint generated always as identity primary key, firm_id uuid not null references public.crm_firms(id), household_id uuid,
 actor_id uuid not null references auth.users(id), action text not null, entity_id text not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index crm_households_firm_updated on public.crm_households(firm_id,updated_at desc);
create index crm_team_user on public.crm_household_team(user_id,firm_id,household_id);
create index crm_tasks_queue on public.crm_tasks(firm_id,status,due_on);
create index crm_meetings_household on public.crm_meetings(firm_id,household_id,occurred_at desc);
create index crm_audit_household on public.crm_audit_events(firm_id,household_id,created_at desc);

-- Security-definer helpers read membership tables without recursive RLS. No caller-supplied user ID is exposed to authenticated clients.
create function public.crm_actor_role(p_firm uuid,p_actor uuid) returns text language sql stable security definer set search_path='' as $$
 select role from public.crm_members where firm_id=p_firm and user_id=p_actor and status='active'
$$;
create function public.crm_actor_can_household(p_firm uuid,p_household uuid,p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(public.crm_actor_role(p_firm,p_actor) in ('owner','admin','supervisor') or
 (public.crm_actor_role(p_firm,p_actor) is not null and exists(select 1 from public.crm_household_team where firm_id=p_firm and household_id=p_household and user_id=p_actor)),false)
$$;
create function public.crm_role(p_firm uuid) returns text language sql stable security definer set search_path='' as $$ select public.crm_actor_role(p_firm,auth.uid()) $$;
create function public.crm_can_household(p_firm uuid,p_household uuid) returns boolean language sql stable security definer set search_path='' as $$ select public.crm_actor_can_household(p_firm,p_household,auth.uid()) $$;
revoke all on function public.crm_actor_role(uuid,uuid),public.crm_actor_can_household(uuid,uuid,uuid),public.crm_role(uuid),public.crm_can_household(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crm_role(uuid),public.crm_can_household(uuid,uuid) to authenticated;
grant execute on function public.crm_actor_role(uuid,uuid),public.crm_actor_can_household(uuid,uuid,uuid) to service_role;

alter table public.crm_firms enable row level security;
alter table public.crm_members enable row level security;
alter table public.crm_households enable row level security;
alter table public.crm_household_team enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_meetings enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_kyp_reviews enable row level security;
alter table public.crm_invites enable row level security;
alter table public.crm_audit_events enable row level security;
revoke all on public.crm_firms,public.crm_members,public.crm_households,public.crm_household_team,public.crm_contacts,public.crm_meetings,public.crm_tasks,public.crm_kyp_reviews,public.crm_invites,public.crm_audit_events from anon,authenticated;
grant select on public.crm_firms,public.crm_members,public.crm_households,public.crm_household_team,public.crm_contacts,public.crm_meetings,public.crm_tasks,public.crm_kyp_reviews,public.crm_invites,public.crm_audit_events to authenticated;
create policy crm_firms_read on public.crm_firms for select to authenticated using(public.crm_role(id) is not null);
create policy crm_members_read on public.crm_members for select to authenticated using(public.crm_role(firm_id) is not null);
create policy crm_households_read on public.crm_households for select to authenticated using(public.crm_can_household(firm_id,id));
create policy crm_team_read on public.crm_household_team for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_contacts_read on public.crm_contacts for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_meetings_read on public.crm_meetings for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_tasks_read on public.crm_tasks for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_kyp_read on public.crm_kyp_reviews for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_invites_read on public.crm_invites for select to authenticated using(public.crm_role(firm_id) in ('owner','admin'));
create policy crm_audit_read on public.crm_audit_events for select to authenticated using(case when household_id is null then public.crm_role(firm_id) in ('owner','admin') else public.crm_can_household(firm_id,household_id) end);

create function public.crm_audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare n jsonb; o jsonb; f uuid; h uuid; actor uuid;
begin
 n=case when tg_op='DELETE' then null else to_jsonb(new) end;
 o=case when tg_op='INSERT' then null else to_jsonb(old) end;
 f=coalesce((n->>'firm_id')::uuid,(o->>'firm_id')::uuid);
 h=coalesce((n->>'household_id')::uuid,(o->>'household_id')::uuid);
 if tg_table_name='crm_firms' then f=(n->>'id')::uuid; end if;
 if tg_table_name='crm_households' then h=coalesce((n->>'id')::uuid,(o->>'id')::uuid); end if;
 actor=nullif(current_setting('app.crm_actor',true),'')::uuid;
 if actor is null then raise exception 'CRM actor context is required'; end if;
 insert into public.crm_audit_events(firm_id,household_id,actor_id,action,entity_id,before_data,after_data)
 values(f,h,actor,tg_table_name||'.'||lower(tg_op),coalesce(n->>'id',o->>'id',n->>'user_id',o->>'user_id','team'),o-'token_hash',n-'token_hash');
 return coalesce(new,old);
end $$;
create trigger crm_firms_audit after insert or update on public.crm_firms for each row execute function public.crm_audit_change();
create trigger crm_members_audit after insert or update on public.crm_members for each row execute function public.crm_audit_change();
create trigger crm_households_audit after insert or update on public.crm_households for each row execute function public.crm_audit_change();
create trigger crm_team_audit after insert or delete on public.crm_household_team for each row execute function public.crm_audit_change();
create trigger crm_contacts_audit after insert or update on public.crm_contacts for each row execute function public.crm_audit_change();
create trigger crm_meetings_audit after insert or update on public.crm_meetings for each row execute function public.crm_audit_change();
create trigger crm_tasks_audit after insert or update on public.crm_tasks for each row execute function public.crm_audit_change();
create trigger crm_kyp_audit after insert or update on public.crm_kyp_reviews for each row execute function public.crm_audit_change();
create trigger crm_invites_audit after insert or update on public.crm_invites for each row execute function public.crm_audit_change();
create function public.crm_protect_final_meeting() returns trigger language plpgsql set search_path='' as $$ begin if old.status='final' then raise exception 'Final meeting notes cannot be edited. Create an amendment.'; end if; return new; end $$;
create trigger crm_final_meeting_immutable before update or delete on public.crm_meetings for each row execute function public.crm_protect_final_meeting();
create trigger crm_audit_immutable before update or delete on public.crm_audit_events for each row execute function public.reject_kyp_archive_mutation();

-- All mutations go through one transaction boundary, with an authenticated actor supplied only by the server.
create function public.crm_write(p_actor uuid,p_firm uuid,p_action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r text; h public.crm_households; m public.crm_meetings; t public.crm_tasks; k public.crm_kyp_reviews; c public.crm_contacts;
 f uuid; hid uuid; item jsonb; uid uuid; lead uuid; mid uuid; result_id uuid; src jsonb; source_row jsonb; meta jsonb; email_value text; member_role text; members uuid[]; row_version integer;
begin
 if p_actor is null or not exists(select 1 from auth.users where id=p_actor) then raise exception 'CRM_UNAUTHORIZED'; end if;
 perform set_config('app.crm_actor',p_actor::text,true);
 if p_action='firm.create' then
  insert into public.crm_firms(name,is_demo,created_by) values(trim(p->>'name'),coalesce((p->>'is_demo')::boolean,false),p_actor) returning id into f;
  insert into public.crm_members(firm_id,user_id,name,email,role) select f,id,coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),email,'owner' from auth.users where id=p_actor;
  if coalesce((p->>'is_demo')::boolean,false) then
   for item in select * from jsonb_array_elements('[{"name":"Demo - Carter household","stage":"active","first":"Jamie","last":"Carter"},{"name":"Demo - Morgan household","stage":"onboarding","first":"Sam","last":"Morgan"}]'::jsonb) loop
    insert into public.crm_households(firm_id,name,stage,lead_advisor_id,review_due,summary,is_demo,created_by,updated_by) values(f,item->>'name',item->>'stage',p_actor,(now() at time zone 'America/Toronto')::date+14,'Fictional sample household. No real client data or account balances.',true,p_actor,p_actor) returning id into hid;
    insert into public.crm_household_team values(f,hid,p_actor);
    insert into public.crm_contacts(firm_id,household_id,first_name,last_name,email,created_by,updated_by) values(f,hid,item->>'first',item->>'last',lower(item->>'first')||'@example.invalid',p_actor,p_actor);
    insert into public.crm_tasks(firm_id,household_id,title,details,assigned_to,due_on,created_by,updated_by) values(f,hid,'Demo: prepare household review','Fictional workflow task. Request client-specific documents before any real assessment.',p_actor,(now() at time zone 'America/Toronto')::date+7,p_actor,p_actor);
   end loop;
  end if;
  return jsonb_build_object('id',f,'firm_id',f);
 end if;
 r=public.crm_actor_role(p_firm,p_actor);
 if r is null then raise exception 'CRM_FORBIDDEN'; end if;
 if p_action='invite.create' then
  if r not in ('owner','admin') then raise exception 'CRM_FORBIDDEN'; end if;
  member_role=p->>'role'; if member_role not in ('admin','advisor','staff','supervisor') or (r<>'owner' and member_role in ('admin','supervisor')) then raise exception 'CRM_FORBIDDEN'; end if;
  if exists(select 1 from public.crm_members where firm_id=p_firm and lower(email)=lower(p->>'email') and status='active') then raise exception 'This person is already an active team member'; end if;
  insert into public.crm_invites(firm_id,email,role,token_hash,created_by) values(p_firm,lower(trim(p->>'email')),member_role,p->>'token_hash',p_actor) returning id into result_id;
  return jsonb_build_object('id',result_id);
 end if;
 if p_action='member.update' then
  uid=(p->>'user_id')::uuid;
  select role into member_role from public.crm_members where firm_id=p_firm and user_id=uid for update;
  if member_role is null or member_role='owner' or r not in ('owner','admin') or (r='admin' and (member_role in ('admin','supervisor') or p->>'role' in ('admin','supervisor'))) then raise exception 'CRM_FORBIDDEN'; end if;
  update public.crm_members set role=p->>'role',status=p->>'status' where firm_id=p_firm and user_id=uid;
  return jsonb_build_object('id',uid);
 end if;
 if p_action='household.create' then
  if r='supervisor' then raise exception 'CRM_FORBIDDEN'; end if;
  lead=coalesce(nullif(p->>'lead_advisor_id','')::uuid,p_actor);
  if coalesce(public.crm_actor_role(p_firm,lead),'') not in ('owner','admin','advisor') then raise exception 'Choose an active lead advisor'; end if;
  insert into public.crm_households(firm_id,name,stage,service_tier,lead_advisor_id,review_due,summary,created_by,updated_by,is_demo)
  values(p_firm,trim(p->>'name'),p->>'stage',p->>'service_tier',lead,nullif(p->>'review_due','')::date,coalesce(p->>'summary',''),p_actor,p_actor,(select is_demo from public.crm_firms where id=p_firm)) returning id into hid;
  members=array(select jsonb_array_elements_text(coalesce(p->'member_ids','[]'::jsonb))::uuid)||array[p_actor,lead];
  foreach uid in array members loop
   if public.crm_actor_role(p_firm,uid) is null then raise exception 'Team members must belong to this firm'; end if;
   insert into public.crm_household_team values(p_firm,hid,uid) on conflict do nothing;
  end loop;
  return jsonb_build_object('id',hid);
 end if;
 -- Resolve every client-level action to its household before checking access.
 if p_action='household.update' then hid=(p->>'id')::uuid;
 elsif p_action='contact.update' then select household_id into hid from public.crm_contacts where firm_id=p_firm and id=(p->>'id')::uuid;
 elsif p_action in ('meeting.update','meeting.finalize') then select household_id into hid from public.crm_meetings where firm_id=p_firm and id=(p->>'id')::uuid;
 elsif p_action='task.update' then select household_id into hid from public.crm_tasks where firm_id=p_firm and id=(p->>'id')::uuid;
 elsif p_action='kyp.update' then select household_id into hid from public.crm_kyp_reviews where firm_id=p_firm and id=(p->>'id')::uuid;
 else hid=nullif(p->>'household_id','')::uuid; end if;
 if hid is null or not public.crm_actor_can_household(p_firm,hid,p_actor) then raise exception 'CRM_FORBIDDEN'; end if;
 select * into h from public.crm_households where firm_id=p_firm and id=hid;
 if h.id is null then raise exception 'CRM_NOT_FOUND'; end if;
 if p_action='household.update' then
  if r not in ('owner','admin') and (r<>'advisor' or h.lead_advisor_id<>p_actor) then raise exception 'CRM_FORBIDDEN'; end if;
  select version into row_version from public.crm_households where id=hid for update;
  if row_version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT'; end if;
  lead=(p->>'lead_advisor_id')::uuid;
  if coalesce(public.crm_actor_role(p_firm,lead),'') not in ('owner','admin','advisor') then raise exception 'Choose an active lead advisor'; end if;
  members=array(select jsonb_array_elements_text(coalesce(p->'member_ids','[]'::jsonb))::uuid)||array[lead];
  foreach uid in array members loop if public.crm_actor_role(p_firm,uid) is null then raise exception 'Team members must belong to this firm'; end if; end loop;
  update public.crm_households set name=trim(p->>'name'),stage=p->>'stage',service_tier=p->>'service_tier',lead_advisor_id=lead,review_due=nullif(p->>'review_due','')::date,summary=coalesce(p->>'summary',''),version=version+1,updated_by=p_actor,updated_at=now() where id=hid;
  delete from public.crm_household_team where firm_id=p_firm and household_id=hid and not(user_id=any(members));
  foreach uid in array members loop insert into public.crm_household_team values(p_firm,hid,uid) on conflict do nothing; end loop;
  return jsonb_build_object('id',hid);
 end if;
 if p_action in ('contact.create','contact.update') then
  if p_action='contact.create' then
   insert into public.crm_contacts(firm_id,household_id,first_name,last_name,relationship,email,phone,created_by,updated_by) values(p_firm,hid,p->>'first_name',p->>'last_name',p->>'relationship',p->>'email',p->>'phone',p_actor,p_actor) returning id into result_id;
  else
   select * into c from public.crm_contacts where firm_id=p_firm and id=(p->>'id')::uuid for update;
   if c.version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT'; end if;
   update public.crm_contacts set first_name=p->>'first_name',last_name=p->>'last_name',relationship=p->>'relationship',email=p->>'email',phone=p->>'phone',version=version+1,updated_by=p_actor,updated_at=now() where id=c.id;
   result_id=c.id;
  end if;
  return jsonb_build_object('id',result_id);
 end if;
 if p_action in ('meeting.create','meeting.update','meeting.finalize') then
  if p_action<>'meeting.create' then
   select * into m from public.crm_meetings where firm_id=p_firm and id=(p->>'id')::uuid for update;
   if m.version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT'; end if;
   if m.created_by<>p_actor and r not in ('owner','admin') then raise exception 'Only the author or a firm administrator may edit or finalize this note'; end if;
   if m.status='final' then raise exception 'Final notes are immutable. Add an amendment.'; end if;
  end if;
  if p_action='meeting.finalize' then
   update public.crm_meetings set status='final',finalized_by=p_actor,finalized_at=now(),version=version+1,updated_by=p_actor,updated_at=now() where id=m.id;
   return jsonb_build_object('id',m.id);
  end if;
  if nullif(p->>'supersedes_id','') is not null and not exists(select 1 from public.crm_meetings where firm_id=p_firm and household_id=hid and id=(p->>'supersedes_id')::uuid and status='final') then raise exception 'An amendment must reference a final note in this household'; end if;
  if p_action='meeting.create' then
   insert into public.crm_meetings(firm_id,household_id,title,occurred_at,attendees,discussion,decisions,supersedes_id,created_by,updated_by) values(p_firm,hid,p->>'title',(p->>'occurred_at')::timestamptz,p->>'attendees',p->>'discussion',p->>'decisions',nullif(p->>'supersedes_id','')::uuid,p_actor,p_actor) returning id into mid;
  else
   update public.crm_meetings set title=p->>'title',occurred_at=(p->>'occurred_at')::timestamptz,attendees=p->>'attendees',discussion=p->>'discussion',decisions=p->>'decisions',version=version+1,updated_by=p_actor,updated_at=now() where id=m.id;
   mid=m.id;
  end if;
  for item in select * from jsonb_array_elements(coalesce(p->'followups','[]'::jsonb)) loop
   uid=(item->>'assigned_to')::uuid;
   if not public.crm_actor_can_household(p_firm,hid,uid) then raise exception 'Assign follow-ups only to active members with household access'; end if;
   insert into public.crm_tasks(firm_id,household_id,meeting_id,title,details,assigned_to,due_on,priority,created_by,updated_by) values(p_firm,hid,mid,item->>'title',coalesce(item->>'details',''),uid,nullif(item->>'due_on','')::date,coalesce(item->>'priority','normal'),p_actor,p_actor);
  end loop;
  return jsonb_build_object('id',mid);
 end if;
 if p_action in ('task.create','task.update') then
  uid=(p->>'assigned_to')::uuid;
  if not public.crm_actor_can_household(p_firm,hid,uid) then raise exception 'Assignee must have household access'; end if;
  if p_action='task.create' then
   insert into public.crm_tasks(firm_id,household_id,title,details,assigned_to,due_on,priority,created_by,updated_by) values(p_firm,hid,p->>'title',p->>'details',uid,nullif(p->>'due_on','')::date,p->>'priority',p_actor,p_actor) returning id into result_id;
  else
   select * into t from public.crm_tasks where firm_id=p_firm and id=(p->>'id')::uuid for update;
   if t.version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT'; end if;
   update public.crm_tasks set title=p->>'title',details=p->>'details',assigned_to=uid,due_on=nullif(p->>'due_on','')::date,priority=p->>'priority',status=p->>'status',completed_at=case when p->>'status'='done' then coalesce(t.completed_at,now()) else null end,version=version+1,updated_by=p_actor,updated_at=now() where id=t.id;
   result_id=t.id;
  end if;
  return jsonb_build_object('id',result_id);
 end if;
 if p_action='kyp.attach' then
  uid=(p->>'assigned_to')::uuid;
  if not public.crm_actor_can_household(p_firm,hid,uid) then raise exception 'Reviewer must have household access'; end if;
  if p->>'source_kind'='simulation' then
   select document into src from public.kyp_simulation_runs where id=(p->>'source_id')::uuid and owner_id=p_actor;
   select value into source_row from jsonb_array_elements(src->'rows') where value->'holding'->>'id'=p->>'holding_id';
   if source_row is null then raise exception 'Private source holding not found'; end if;
   meta=jsonb_build_object('source_kind','simulation','source_state','draft','identity',source_row->>'identity','source_date',src->>'reportDate','private_source_owner',p_actor,'sharing','Product metadata only; private notes and book totals are not shared');
   item=jsonb_build_object('name',source_row->'holding'->>'requestedName','identifier',source_row->'holding'->'portfolioHolding'->>'identifier');
  elsif p->>'source_kind'='archive' then
   select a.document::jsonb into src from public.kyp_review_archive a where a.id=(p->>'source_id')::uuid and a.owner_id=p_actor and a.kind='audit' and a.sha256=encode(sha256(convert_to(a.document,'UTF8')),'hex');
   if src is null then raise exception 'Private archived review not found'; end if;
   meta=jsonb_build_object('source_kind','archive','source_state','archived_product_review','source_date',src->>'generatedAt','private_source_owner',p_actor,'sharing','Product metadata only; private archived notes are not shared');
   item=jsonb_build_object('name',src->'research'->'target'->>'name','identifier',src->'research'->'target'->>'symbol');
  else raise exception 'Invalid KYP source'; end if;
  insert into public.crm_kyp_reviews(firm_id,household_id,source_kind,source_id,holding_id,product_name,identifier,source_metadata,review_status,review_notes,assigned_to,due_on,created_by,updated_by)
  values(p_firm,hid,p->>'source_kind',(p->>'source_id')::uuid,p->>'holding_id',item->>'name',item->>'identifier',meta,case when p->>'source_kind'='simulation' then 'needs_evidence' else 'open' end,coalesce(p->>'review_notes',''),uid,nullif(p->>'due_on','')::date,p_actor,p_actor) returning id into result_id;
  return jsonb_build_object('id',result_id);
 end if;
 if p_action='kyp.update' then
  select * into k from public.crm_kyp_reviews where firm_id=p_firm and id=(p->>'id')::uuid for update;
  if k.version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT'; end if;
  if p->>'review_status'='reviewed' and (r not in ('owner','admin','supervisor') or k.source_kind<>'archive' or length(trim(p->>'review_notes'))<20) then raise exception 'A supervisor or administrator must review an archived product record and record the review basis'; end if;
  uid=(p->>'assigned_to')::uuid;
  if not public.crm_actor_can_household(p_firm,hid,uid) then raise exception 'Reviewer must have household access'; end if;
  update public.crm_kyp_reviews set review_status=p->>'review_status',review_notes=p->>'review_notes',assigned_to=uid,due_on=nullif(p->>'due_on','')::date,reviewed_by=case when p->>'review_status'='reviewed' then p_actor else null end,reviewed_at=case when p->>'review_status'='reviewed' then now() else null end,version=version+1,updated_by=p_actor,updated_at=now() where id=k.id;
  return jsonb_build_object('id',k.id);
 end if;
 raise exception 'Unknown CRM action';
end $$;
revoke all on function public.crm_write(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.crm_write(uuid,uuid,text,jsonb) to service_role;

create function public.crm_accept_invite(p_actor uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.crm_invites; person auth.users;
begin
 select * into person from auth.users where id=p_actor;
 if person.id is null then raise exception 'CRM_UNAUTHORIZED'; end if;
 select * into i from public.crm_invites where token_hash=p_hash for update;
 if i.id is null or i.expires_at<now() or lower(i.email)<>lower(person.email) then raise exception 'This invitation is invalid, expired or intended for another email address'; end if;
 if coalesce(public.crm_actor_role(i.firm_id,i.created_by),'') not in ('owner','admin') then raise exception 'Invitation issuer is no longer authorized'; end if;
 if i.used_at is not null then
  if i.used_by=p_actor and public.crm_actor_role(i.firm_id,p_actor) is not null then return jsonb_build_object('firm_id',i.firm_id); end if;
  raise exception 'This invitation has already been used';
 end if;
 perform set_config('app.crm_actor',p_actor::text,true);
 if exists(select 1 from public.crm_members where firm_id=i.firm_id and user_id=p_actor) then raise exception 'Membership already exists; ask the firm administrator to update it'; end if;
 insert into public.crm_members(firm_id,user_id,name,email,role) values(i.firm_id,p_actor,coalesce(nullif(person.raw_user_meta_data->>'name',''),split_part(person.email,'@',1)),person.email,i.role);
 update public.crm_invites set used_at=now(),used_by=p_actor where id=i.id;
 return jsonb_build_object('firm_id',i.firm_id);
end $$;
revoke all on function public.crm_accept_invite(uuid,text) from public,anon,authenticated;
grant execute on function public.crm_accept_invite(uuid,text) to service_role;

create table public.crm_requests (
 actor_id uuid not null references auth.users(id), request_id uuid not null, payload_hash text not null, result jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,request_id)
);
alter table public.crm_requests enable row level security;
revoke all on public.crm_requests from anon,authenticated;
create function public.crm_dispatch(p_actor uuid,p_firm uuid,p_action text,p jsonb,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.crm_requests; fingerprint text; answer jsonb;
begin
 if p_request is null or p_actor is null then raise exception 'CRM_UNAUTHORIZED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,0));
 fingerprint=encode(sha256(convert_to(p_action||coalesce(p_firm::text,'')||p::text,'UTF8')),'hex');
 select * into existing from public.crm_requests where actor_id=p_actor and request_id=p_request;
 if found then
  if existing.payload_hash<>fingerprint then raise exception 'CRM_CONFLICT'; end if;
  if p_firm is not null and public.crm_actor_role(p_firm,p_actor) is null then raise exception 'CRM_FORBIDDEN'; end if;
  return existing.result;
 end if;
 answer=public.crm_write(p_actor,p_firm,p_action,p);
 insert into public.crm_requests(actor_id,request_id,payload_hash,result) values(p_actor,p_request,fingerprint,answer);
 return answer;
end $$;
revoke all on function public.crm_dispatch(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.crm_dispatch(uuid,uuid,text,jsonb,uuid) to service_role;

commit;
