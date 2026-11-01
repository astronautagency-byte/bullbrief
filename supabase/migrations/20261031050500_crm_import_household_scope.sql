-- Validate actual firm ownership in addition to role-based access during preview.
create or replace function public.crm_import(p_actor uuid,p_firm uuid,p_kind text,p_rows jsonb,p_lead uuid,p_commit boolean,p_request uuid,p_preview_hash text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item jsonb; results jsonb='[]'; answer jsonb; previous public.crm_requests; existing public.crm_import_keys;
 key text; fingerprint text; request_hash text; plan_hash text; hid uuid; eid uuid; row_num integer=1; added integer=0; skipped integer=0; output jsonb;
begin
 if coalesce(public.crm_actor_role(p_firm,p_actor),'') not in ('owner','admin') then raise exception 'CRM_FORBIDDEN'; end if;
 if p_kind not in ('households','accounts') or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 200 then raise exception 'Invalid import'; end if;
 -- Serialize import plans and commits within a firm, and retries across all request types.
 perform pg_advisory_xact_lock(hashtextextended('crm-import:'||p_firm::text,0));
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,0));
 request_hash=encode(sha256(convert_to(jsonb_build_object('action','csv.import','firm',p_firm,'kind',p_kind,'rows',p_rows,'lead',p_lead)::text,'UTF8')),'hex');
 if p_commit then
  select * into previous from public.crm_requests where actor_id=p_actor and request_id=p_request;
  if found then if previous.payload_hash<>request_hash then raise exception 'CRM_CONFLICT'; end if; return previous.result; end if;
 end if;
 if p_kind='households' and coalesce(public.crm_actor_role(p_firm,p_lead),'') not in ('owner','admin','advisor') then raise exception 'Choose an active lead advisor'; end if;
 for item in select * from jsonb_array_elements(p_rows) loop
  row_num=row_num+1;
  key=case when p_kind='accounts' then lower(item->>'institution')||':' else '' end||(item->>'external_id');
  fingerprint=encode(sha256(convert_to(item::text,'UTF8')),'hex');
  select * into existing from public.crm_import_keys where firm_id=p_firm and kind=p_kind and source_key=key;
  if found then
   if existing.payload_hash<>fingerprint then raise exception 'Row %: external ID already imported with different data. Imports never overwrite existing records.',row_num; end if;
   skipped=skipped+1;
   results=results||jsonb_build_array(jsonb_build_object('row',row_num,'name',coalesce(item->>'name',item->>'institution'),'status','skip','household_id',existing.household_id));
   continue;
  end if;
  if p_kind='households' then
   if exists(select 1 from public.crm_households where firm_id=p_firm and lower(trim(name))=lower(trim(item->>'name'))) then raise exception 'Row %: household name already exists. Review this match manually; no automatic merge was made.',row_num; end if;
   hid=null;
  else
   hid=(item->>'household_id')::uuid;
   if not exists(select 1 from public.crm_households where firm_id=p_firm and id=hid) or not public.crm_actor_can_household(p_firm,hid,p_actor) then raise exception 'Row %: choose a household in this firm.',row_num; end if;
   if exists(select 1 from public.crm_accounts where firm_id=p_firm and household_id=hid and lower(institution)=lower(item->>'institution') and last_four=item->>'last_four' and account_type=item->>'account_type') then raise exception 'Row %: possible duplicate account (institution, household, type and last four). Review manually.',row_num; end if;
  end if;
  added=added+1;
  results=results||jsonb_build_array(jsonb_build_object('row',row_num,'name',coalesce(item->>'name',item->>'institution'),'status','create','household_id',hid));
 end loop;
 -- Also reject collisions inside the file before writing any row.
 if exists(select 1 from jsonb_array_elements(p_rows) x group by case when p_kind='accounts' then lower(x->>'institution')||':' else '' end||(x->>'external_id') having count(*)>1) then raise exception 'Duplicate external IDs in file'; end if;
 if p_kind='accounts' and exists(select 1 from jsonb_array_elements(p_rows) x group by x->>'household_id',lower(x->>'institution'),x->>'account_type',x->>'last_four' having count(*)>1) then raise exception 'Possible duplicate accounts in file'; end if;
 plan_hash=encode(sha256(convert_to(request_hash||results::text,'UTF8')),'hex');
 if p_commit and p_preview_hash is distinct from plan_hash then raise exception 'CRM_CONFLICT: import preview changed'; end if;
 if p_commit then
  perform set_config('app.crm_actor',p_actor::text,true);
  for item in select * from jsonb_array_elements(p_rows) loop
   key=case when p_kind='accounts' then lower(item->>'institution')||':' else '' end||(item->>'external_id');
   if exists(select 1 from public.crm_import_keys where firm_id=p_firm and kind=p_kind and source_key=key) then continue; end if;
   if p_kind='households' then
    output=public.crm_write(p_actor,p_firm,'household.create',jsonb_build_object('name',item->>'name','stage',item->>'stage','service_tier',item->>'service_tier','lead_advisor_id',p_lead,'member_ids','[]'::jsonb,'summary','Imported household. KYC and suitability require separate verification.'));
    hid=(output->>'id')::uuid; eid=hid;
    if coalesce(item->>'first_name','')<>'' then perform public.crm_write(p_actor,p_firm,'contact.create',item||jsonb_build_object('household_id',hid,'relationship','Primary contact')); end if;
   else
    hid=(item->>'household_id')::uuid;
    insert into public.crm_accounts(firm_id,household_id,external_id,institution,account_type,last_four,currency,balance,as_of,created_by)
    values(p_firm,hid,item->>'external_id',item->>'institution',item->>'account_type',item->>'last_four',item->>'currency',nullif(item->>'balance','')::numeric,nullif(item->>'as_of','')::date,p_actor) returning id into eid;
   end if;
   insert into public.crm_import_keys(firm_id,kind,source_key,payload_hash,household_id,entity_id,created_by)
   values(p_firm,p_kind,key,encode(sha256(convert_to(item::text,'UTF8')),'hex'),hid,eid,p_actor);
  end loop;
 end if;
 answer=jsonb_build_object('rows',results,'created',added,'skipped',skipped,'committed',p_commit,'preview_hash',plan_hash);
 if p_commit then insert into public.crm_requests(actor_id,request_id,payload_hash,result) values(p_actor,p_request,request_hash,answer); end if;
 return answer;
end $$;
