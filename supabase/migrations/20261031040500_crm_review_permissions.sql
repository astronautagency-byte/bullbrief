-- A completed supervisory review cannot be reopened or altered by support roles.
create or replace function public.crm_write(p_actor uuid,p_firm uuid,p_action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
  if k.review_status='reviewed' and r not in ('owner','admin','supervisor') then raise exception 'CRM_FORBIDDEN'; end if;
  if p->>'review_status'='reviewed' and (r not in ('owner','admin','supervisor') or k.source_kind<>'archive' or length(trim(p->>'review_notes'))<20) then raise exception 'A supervisor or administrator must review an archived product record and record the review basis'; end if;
  uid=(p->>'assigned_to')::uuid;
  if not public.crm_actor_can_household(p_firm,hid,uid) then raise exception 'Reviewer must have household access'; end if;
  update public.crm_kyp_reviews set review_status=p->>'review_status',review_notes=p->>'review_notes',assigned_to=uid,due_on=nullif(p->>'due_on','')::date,reviewed_by=case when p->>'review_status'='reviewed' then p_actor else null end,reviewed_at=case when p->>'review_status'='reviewed' then now() else null end,version=version+1,updated_by=p_actor,updated_at=now() where id=k.id;
  return jsonb_build_object('id',k.id);
 end if;
 raise exception 'Unknown CRM action';
end $$;
