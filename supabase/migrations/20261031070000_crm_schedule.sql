create table public.crm_appointments (
 id uuid primary key default gen_random_uuid(),firm_id uuid not null references public.crm_firms(id),household_id uuid not null,owner_id uuid not null,
 title text not null check(length(title) between 2 and 180),meeting_type text not null check(meeting_type in ('annual_review','check_in','discovery','estate','other')),
 starts_at timestamptz not null,ends_at timestamptz not null,location text not null default '' check(length(location)<=300),join_url text not null default '' check(length(join_url)<=1500),agenda text not null default '' check(length(agenda)<=6000),scratchpad text not null default '' check(length(scratchpad)<=15000),
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),meeting_id uuid references public.crm_meetings(id),version integer not null default 1,
 created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id),foreign key(firm_id,owner_id) references public.crm_members(firm_id,user_id),
 check(ends_at-starts_at between interval '5 minutes' and interval '8 hours'),check(join_url='' or join_url ~ '^https://')
);
create index crm_appointment_dates on public.crm_appointments(firm_id,starts_at);
alter table public.crm_appointments enable row level security;
revoke all on public.crm_appointments from anon,authenticated;
grant select on public.crm_appointments to authenticated;
create policy crm_appointments_read on public.crm_appointments for select to authenticated using(public.crm_can_household(firm_id,household_id));
create trigger crm_appointments_audit after insert or update on public.crm_appointments for each row execute function public.crm_audit_change();
create function public.crm_schedule_dispatch(p_actor uuid,p_firm uuid,p_action text,p jsonb,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.crm_appointments; existing public.crm_requests; fingerprint text; answer jsonb; result_id uuid; h uuid; owner uuid; result jsonb;
begin
 if public.crm_actor_role(p_firm,p_actor) is null then raise exception 'CRM_FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,0));
 fingerprint=encode(sha256(convert_to('schedule:'||p_action||p_firm::text||p::text,'UTF8')),'hex');
 select * into existing from public.crm_requests where actor_id=p_actor and request_id=p_request;
 if found then if existing.payload_hash<>fingerprint then raise exception 'CRM_CONFLICT';end if;return existing.result;end if;
 perform set_config('app.crm_actor',p_actor::text,true);
 if p_action='appointment.create' then h=(p->>'household_id')::uuid;
 else
  select * into a from public.crm_appointments where firm_id=p_firm and id=(p->>'id')::uuid for update;
  if not found then raise exception 'CRM_NOT_FOUND';end if;
  h=a.household_id;
  if a.version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT';end if;
 end if;
 if not exists(select 1 from public.crm_households where firm_id=p_firm and id=h) or not public.crm_actor_can_household(p_firm,h,p_actor) then raise exception 'CRM_FORBIDDEN';end if;
 if p_action in ('appointment.create','appointment.update') then
  owner=(p->>'owner_id')::uuid;
  if public.crm_actor_role(p_firm,owner) is null or not public.crm_actor_can_household(p_firm,h,owner) then raise exception 'Choose an active owner with household access';end if;
  if p_action='appointment.update' and ((p->>'household_id')::uuid<>h or a.status<>'scheduled') then raise exception 'Only scheduled meetings can be rescheduled; the household cannot change';end if;
  -- Serialize overlap checking for an owner's schedule across firms.
  perform pg_advisory_xact_lock(hashtextextended('crm-calendar:'||owner::text,0));
  if exists(select 1 from public.crm_appointments where owner_id=owner and status='scheduled' and id<>coalesce(a.id,'00000000-0000-0000-0000-000000000000'::uuid) and starts_at<(p->>'ends_at')::timestamptz and ends_at>(p->>'starts_at')::timestamptz) then raise exception 'The owner has an overlapping scheduled meeting. Choose another time or owner.';end if;
  if p_action='appointment.create' then
   insert into public.crm_appointments(firm_id,household_id,owner_id,title,meeting_type,starts_at,ends_at,location,join_url,agenda,created_by,updated_by) values(p_firm,h,owner,p->>'title',p->>'meeting_type',(p->>'starts_at')::timestamptz,(p->>'ends_at')::timestamptz,p->>'location',p->>'join_url',p->>'agenda',p_actor,p_actor) returning id into result_id;
  else
   update public.crm_appointments set owner_id=owner,title=p->>'title',meeting_type=p->>'meeting_type',starts_at=(p->>'starts_at')::timestamptz,ends_at=(p->>'ends_at')::timestamptz,location=p->>'location',join_url=p->>'join_url',agenda=p->>'agenda',version=version+1,updated_by=p_actor,updated_at=now() where id=a.id returning id into result_id;
  end if;
 elsif p_action='appointment.scratchpad' then
  if a.meeting_id is not null or a.status='cancelled' then raise exception 'This session is closed. Amend the saved meeting record instead.';end if;
  update public.crm_appointments set scratchpad=p->>'scratchpad',version=version+1,updated_by=p_actor,updated_at=now() where id=a.id returning id into result_id;
 elsif p_action='appointment.status' then
  if p->>'status' not in ('completed','cancelled') or a.status<>'scheduled' then raise exception 'Choose completed or cancelled for a scheduled meeting';end if;
  update public.crm_appointments set status=p->>'status',version=version+1,updated_by=p_actor,updated_at=now() where id=a.id returning id into result_id;
 elsif p_action='appointment.record' then
  if a.status='cancelled' or a.meeting_id is not null or coalesce((p->>'confirmed')::boolean,false)=false or length(trim(p->>'discussion'))<10 then raise exception 'Review the actual discussion before creating a draft meeting record';end if;
  result=public.crm_write(p_actor,p_firm,'meeting.create',jsonb_build_object('household_id',h,'title',a.title,'occurred_at',a.starts_at,'attendees',p->>'attendees','discussion',p->>'discussion','decisions',p->>'decisions','followups',coalesce(p->'followups','[]'::jsonb)));
  update public.crm_appointments set meeting_id=(result->>'id')::uuid,status='completed',version=version+1,updated_by=p_actor,updated_at=now() where id=a.id returning id into result_id;
 else raise exception 'Unsupported schedule action';end if;
 answer=jsonb_build_object('id',result_id);
 insert into public.crm_requests(actor_id,request_id,payload_hash,result) values(p_actor,p_request,fingerprint,answer);
 return answer;
end $$;
revoke all on function public.crm_schedule_dispatch(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.crm_schedule_dispatch(uuid,uuid,text,jsonb,uuid) to service_role;
