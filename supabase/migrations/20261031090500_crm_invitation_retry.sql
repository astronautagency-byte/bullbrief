-- A definite rejection permits a newly reviewed attempt; uncertain submissions remain blocked.
create or replace function public.crm_invitation_command(p_actor uuid,p_firm uuid,p_action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.crm_appointments; i public.crm_meeting_invitations; recipients jsonb; contact_count integer;
begin
 if public.crm_actor_role(p_firm,p_actor) is null then raise exception 'CRM_FORBIDDEN';end if;
 select * into a from public.crm_appointments where id=(p->>'appointment_id')::uuid and firm_id=p_firm for update;
 if not found or not public.crm_actor_can_household(p_firm,a.household_id,p_actor) or a.owner_id<>p_actor then raise exception 'CRM_FORBIDDEN';end if;
 select * into i from public.crm_meeting_invitations where appointment_id=a.id for update;
 if p_action='begin' then
  if i.id is not null and i.status='rejected' then delete from public.crm_meeting_invitations where id=i.id;i.id=null;end if;
  if i.id is not null then return jsonb_build_object('id',i.id,'status',i.status);end if;
  if a.version<>(p->>'version')::integer or a.status<>'scheduled' or a.starts_at<=now() then raise exception 'CRM_CONFLICT';end if;
  if jsonb_typeof(p->'contact_ids')<>'array' or jsonb_array_length(p->'contact_ids') not between 1 and 20 then raise exception 'Choose between one and twenty client contacts.';end if;
  select count(distinct value::text) into contact_count from jsonb_array_elements_text(p->'contact_ids');
  select jsonb_agg(jsonb_build_object('id',c.id,'name',trim(c.first_name||' '||c.last_name),'email',c.email)) into recipients from public.crm_contacts c
   where c.firm_id=p_firm and c.household_id=a.household_id and c.id::text in(select value from jsonb_array_elements_text(p->'contact_ids')) and c.version=coalesce((p->'contact_versions'->>c.id::text)::integer,0) and c.email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';
  if recipients is null or jsonb_array_length(recipients)<>contact_count then raise exception 'Each selected contact must belong to this household and have a valid email.';end if;
  insert into public.crm_meeting_invitations(appointment_id,firm_id,household_id,sender_id,appointment_version,recipients,payload,status)
   values(a.id,p_firm,a.household_id,p_actor,a.version,recipients,jsonb_build_object('title',a.title,'starts_at',a.starts_at,'ends_at',a.ends_at,'location',a.location,'agenda',p->>'client_agenda','teams',coalesce((p->>'teams')::boolean,false),'join_url',a.join_url),'sending') returning * into i;
  insert into public.crm_audit_events(firm_id,household_id,actor_id,action,entity_id,after_data) values(p_firm,a.household_id,p_actor,'meeting.invitation_requested',i.id::text,jsonb_build_object('recipient_count',contact_count));
  return to_jsonb(i);
 end if;
 if i.id is null or i.sender_id<>p_actor or i.lease_id<>(p->>'lease_id')::uuid then raise exception 'CRM_CONFLICT';end if;
 if i.status<>'sending' then return jsonb_build_object('id',i.id,'status',i.status);end if;
 if p_action='accepted' then
  update public.crm_meeting_invitations set status='accepted',provider_id=p->>'provider_id',join_url=p->>'join_url',web_url=p->>'web_url',accepted_at=now() where id=i.id;
 elsif p_action in ('uncertain','rejected') then update public.crm_meeting_invitations set status=p_action where id=i.id;
 else raise exception 'Unsupported invitation action';end if;
 insert into public.crm_audit_events(firm_id,household_id,actor_id,action,entity_id,after_data) values(p_firm,a.household_id,p_actor,'meeting.invitation_'||p_action,i.id::text,jsonb_build_object('provider','microsoft'));
 return jsonb_build_object('id',i.id,'status',p_action);
end $$;
create or replace function public.crm_guard_invited_appointment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.title,new.starts_at,new.ends_at,new.location,new.join_url,new.owner_id) is distinct from (old.title,old.starts_at,old.ends_at,old.location,old.join_url,old.owner_id) or (new.status='cancelled' and old.status<>'cancelled') then
  if exists(select 1 from public.crm_meeting_invitations where appointment_id=old.id and status<>'rejected') then raise exception 'This meeting has an invitation receipt. Manage changes or cancellation in Outlook; the BullBrief schedule remains the original snapshot.';end if;
 end if;return new;
end $$;
