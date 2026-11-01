-- Remove a shadowing local variable from the private Microsoft command function.
create or replace function public.crm_ms_command(p_actor uuid,p_firm uuid,p_action text,p jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.crm_ms_connections; attempt public.crm_ms_oauth_attempts; item jsonb; f uuid=p_firm; lease uuid; result jsonb;
begin
 if p_action='oauth.consume' then
  select * into attempt from public.crm_ms_oauth_attempts where state_hash=p->>'state_hash' and nonce_hash=p->>'nonce_hash' and user_id=p_actor and expires_at>now();
  if not found then raise exception 'CRM_FORBIDDEN';end if;f=attempt.firm_id;
 end if;
 if public.crm_actor_role(f,p_actor) is null then raise exception 'CRM_FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended('crm-ms:'||f::text||p_actor::text,0));
 if p_action='oauth.consume' then
  delete from public.crm_ms_oauth_attempts where state_hash=p->>'state_hash' and nonce_hash=p->>'nonce_hash' and user_id=p_actor and expires_at>now() returning * into attempt;
  if not found then raise exception 'CRM_FORBIDDEN';end if;
 end if;
 select * into c from public.crm_ms_connections where firm_id=f and user_id=p_actor for update;
 if p_action='oauth.begin' then
  if c.id is null then
   insert into public.crm_ms_connections(firm_id,user_id,status) values(f,p_actor,'connecting') returning * into c;
  else
   update public.crm_ms_connections set generation=gen_random_uuid(),status='connecting',cache_ciphertext=null,account_id=null,last_sync_error=null,lease_id=null,lease_until=null where id=c.id returning * into c;
  end if;
  delete from public.crm_ms_items where connection_id=c.id;
  delete from public.crm_ms_oauth_attempts where connection_id=c.id;
  insert into public.crm_ms_oauth_attempts(state_hash,connection_id,firm_id,user_id,generation,nonce_hash,verifier_ciphertext) values(p->>'state_hash',c.id,f,p_actor,c.generation,p->>'nonce_hash',p->>'verifier_ciphertext');
  return jsonb_build_object('id',c.id,'generation',c.generation);
 end if;
 if c.id is null then raise exception 'CRM_NOT_FOUND';end if;
 if p_action='oauth.consume' then
  if c.generation<>attempt.generation or c.status<>'connecting' then raise exception 'CRM_CONFLICT';end if;
  return jsonb_build_object('id',c.id,'firm_id',f,'generation',c.generation,'verifier_ciphertext',attempt.verifier_ciphertext);
 elsif p_action='oauth.complete' then
  if c.generation<>(p->>'generation')::uuid or c.status<>'connecting' then raise exception 'CRM_CONFLICT';end if;
  update public.crm_ms_connections set status='connected',cache_ciphertext=p->>'cache_ciphertext',account_id=p->>'account_id',email=p->>'email',tenant_id=p->>'tenant_id',scopes=p->'scopes',connected_at=now(),last_sync_at=null,last_sync_error=null where id=c.id;
  insert into public.crm_audit_events(firm_id,actor_id,action,entity_id,after_data) values(f,p_actor,'outlook.connected',c.id::text,jsonb_build_object('visibility','private_to_user','scope','read_only_metadata'));
 elsif p_action='oauth.fail' then
  if c.generation=(p->>'generation')::uuid and c.status='connecting' then update public.crm_ms_connections set status='reauth_required',cache_ciphertext=null,account_id=null where id=c.id;end if;
 elsif p_action='sync.begin' then
  if c.status<>'connected' or c.cache_ciphertext is null then raise exception 'Reconnect Outlook before synchronizing.';end if;
  if c.lease_until>now() or c.last_sync_attempt>now()-interval '60 seconds' then raise exception 'A sync is running or was just attempted. Wait a minute before retrying.';end if;
  lease=gen_random_uuid();update public.crm_ms_connections set lease_id=lease,lease_until=now()+interval '3 minutes',last_sync_attempt=now() where id=c.id;
  return jsonb_build_object('id',c.id,'generation',c.generation,'lease_id',lease,'cache_ciphertext',c.cache_ciphertext,'account_id',c.account_id,'tenant_id',c.tenant_id);
 elsif p_action='sync.finish' then
  if c.generation<>(p->>'generation')::uuid or c.lease_id is distinct from (p->>'lease_id')::uuid or c.lease_until<now() or c.status<>'connected' then raise exception 'CRM_CONFLICT';end if;
  if jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items')>1000 then raise exception 'Invalid Outlook snapshot';end if;
  delete from public.crm_ms_items where connection_id=c.id;
  for item in select * from jsonb_array_elements(p->'items') loop
   insert into public.crm_ms_items(connection_id,firm_id,user_id,kind,provider_id,metadata,occurred_at) values(c.id,f,p_actor,item->>'kind',item->>'provider_id',item->'metadata',(item->>'occurred_at')::timestamptz);
  end loop;
  update public.crm_ms_connections set cache_ciphertext=p->>'cache_ciphertext',last_sync_at=now(),last_sync_error=null,lease_id=null,lease_until=null where id=c.id;
  insert into public.crm_audit_events(firm_id,actor_id,action,entity_id,after_data) values(f,p_actor,'outlook.synced',c.id::text,jsonb_build_object('visibility','private_to_user','item_count',jsonb_array_length(p->'items')));
 elsif p_action='sync.fail' then
  if c.generation=(p->>'generation')::uuid and c.lease_id=(p->>'lease_id')::uuid then
   update public.crm_ms_connections set lease_id=null,lease_until=null,last_sync_error=case when p->>'code' in ('reauth_required','throttled','too_many_items','provider_unavailable') then p->>'code' else 'provider_unavailable' end,
   status=case when p->>'code'='reauth_required' then 'reauth_required' else status end,
   cache_ciphertext=case when p->>'code'='reauth_required' then null else coalesce(nullif(p->>'cache_ciphertext',''),cache_ciphertext) end where id=c.id;
  end if;
 elsif p_action='disconnect' then
  delete from public.crm_ms_connections where id=c.id;
  insert into public.crm_audit_events(firm_id,actor_id,action,entity_id,after_data) values(f,p_actor,'outlook.disconnected',c.id::text,jsonb_build_object('private_cache_removed',true));
 else raise exception 'Unsupported Microsoft action';end if;
 return jsonb_build_object('id',c.id);
end $$;
