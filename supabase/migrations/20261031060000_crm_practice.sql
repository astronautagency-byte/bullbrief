create table public.crm_opportunities (
 id uuid primary key default gen_random_uuid(),firm_id uuid not null references public.crm_firms(id),household_id uuid not null,
 title text not null check(length(title) between 2 and 180),stage text not null check(stage in ('new','discovery','proposal','commitment','won','lost')),
 owner_id uuid not null, potential_assets numeric(15,2) not null check(potential_assets>=0),currency text not null check(currency in ('CAD','USD')),expected_close date,notes text not null default '' check(length(notes)<=4000),version integer not null default 1,
 created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(firm_id,household_id) references public.crm_households(firm_id,id),foreign key(firm_id,owner_id) references public.crm_members(firm_id,user_id)
);
create table public.crm_workflow_templates (
 id uuid primary key default gen_random_uuid(),firm_id uuid not null references public.crm_firms(id),name text not null check(length(name) between 2 and 120),description text not null default '' check(length(description)<=1000),
 steps jsonb not null check(jsonb_typeof(steps)='array' and jsonb_array_length(steps) between 1 and 20),version integer not null default 1,
 created_by uuid not null references auth.users(id),updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(firm_id,id)
);
create table public.crm_workflow_runs (
 id uuid primary key default gen_random_uuid(),firm_id uuid not null references public.crm_firms(id),household_id uuid not null,template_id uuid not null,name text not null,template_snapshot jsonb not null,
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),foreign key(firm_id,household_id) references public.crm_households(firm_id,id),foreign key(firm_id,template_id) references public.crm_workflow_templates(firm_id,id),unique(firm_id,id)
);
create table public.crm_workflow_steps (
 id uuid primary key default gen_random_uuid(),firm_id uuid not null references public.crm_firms(id),household_id uuid not null,run_id uuid not null,task_id uuid not null unique references public.crm_tasks(id),step_order integer not null,
 foreign key(firm_id,run_id) references public.crm_workflow_runs(firm_id,id),foreign key(firm_id,household_id) references public.crm_households(firm_id,id),unique(run_id,step_order)
);
alter table public.crm_opportunities enable row level security;
alter table public.crm_workflow_templates enable row level security;
alter table public.crm_workflow_runs enable row level security;
alter table public.crm_workflow_steps enable row level security;
revoke all on public.crm_opportunities,public.crm_workflow_templates,public.crm_workflow_runs,public.crm_workflow_steps from anon,authenticated;
grant select on public.crm_opportunities,public.crm_workflow_templates,public.crm_workflow_runs,public.crm_workflow_steps to authenticated;
create policy crm_opportunities_read on public.crm_opportunities for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_templates_read on public.crm_workflow_templates for select to authenticated using(public.crm_role(firm_id) is not null);
create policy crm_runs_read on public.crm_workflow_runs for select to authenticated using(public.crm_can_household(firm_id,household_id));
create policy crm_steps_read on public.crm_workflow_steps for select to authenticated using(public.crm_can_household(firm_id,household_id));
create trigger crm_opportunity_audit after insert or update on public.crm_opportunities for each row execute function public.crm_audit_change();
create trigger crm_template_audit after insert or update on public.crm_workflow_templates for each row execute function public.crm_audit_change();
create trigger crm_run_audit after insert on public.crm_workflow_runs for each row execute function public.crm_audit_change();
create trigger crm_step_audit after insert on public.crm_workflow_steps for each row execute function public.crm_audit_change();

create function public.crm_workflow_task_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare step public.crm_workflow_steps;
begin
 if new.status=old.status then return new; end if;
 select * into step from public.crm_workflow_steps where task_id=new.id;
 if found then
  perform 1 from public.crm_workflow_runs where id=step.run_id for update;
  if new.status in ('open','cancelled') and exists(select 1 from public.crm_workflow_steps s join public.crm_tasks t on t.id=s.task_id where s.run_id=step.run_id and s.step_order>step.step_order and t.status in ('in_progress','done')) then raise exception 'Later workflow steps have started. Preserve the completed prerequisites.'; end if;
  if new.status in ('done','in_progress') and exists(select 1 from public.crm_workflow_steps s join public.crm_tasks t on t.id=s.task_id where s.run_id=step.run_id and s.step_order<step.step_order and t.status<>'done') then raise exception 'Complete the previous workflow steps first.'; end if;
 end if;
 return new;
end $$;
create trigger crm_workflow_task_sequence before update on public.crm_tasks for each row execute function public.crm_workflow_task_guard();

create function public.crm_practice_dispatch(p_actor uuid,p_firm uuid,p_action text,p jsonb,p_request uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare role text; h uuid; existing public.crm_requests; fingerprint text; answer jsonb; result_id uuid; current_version integer; template public.crm_workflow_templates; item jsonb; idx integer=0; task jsonb; owner uuid;
begin
 role=public.crm_actor_role(p_firm,p_actor);if role is null then raise exception 'CRM_FORBIDDEN';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request::text,0));
 fingerprint=encode(sha256(convert_to('practice:'||p_action||p_firm::text||p::text,'UTF8')),'hex');
 select * into existing from public.crm_requests where actor_id=p_actor and request_id=p_request;
 if found then if existing.payload_hash<>fingerprint then raise exception 'CRM_CONFLICT';end if;return existing.result;end if;
 perform set_config('app.crm_actor',p_actor::text,true);
 if p_action in ('template.create','template.update') then
  if role not in ('owner','admin') then raise exception 'CRM_FORBIDDEN';end if;
  if p_action='template.create' then
   insert into public.crm_workflow_templates(firm_id,name,description,steps,created_by,updated_by) values(p_firm,p->>'name',p->>'description',p->'steps',p_actor,p_actor) returning id into result_id;
  else
   select version into current_version from public.crm_workflow_templates where firm_id=p_firm and id=(p->>'id')::uuid for update;
   if current_version is null then raise exception 'CRM_NOT_FOUND';end if;
   if current_version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT';end if;
   update public.crm_workflow_templates set name=p->>'name',description=p->>'description',steps=p->'steps',version=version+1,updated_by=p_actor,updated_at=now() where id=(p->>'id')::uuid returning id into result_id;
  end if;
 elsif p_action in ('opportunity.create','opportunity.update','workflow.start') then
  h=(p->>'household_id')::uuid;
  if not exists(select 1 from public.crm_households where firm_id=p_firm and id=h) or not public.crm_actor_can_household(p_firm,h,p_actor) then raise exception 'CRM_FORBIDDEN';end if;
  if p_action='workflow.start' then
   owner=(p->>'assigned_to')::uuid;
   if public.crm_actor_role(p_firm,owner) is null or not public.crm_actor_can_household(p_firm,h,owner) then raise exception 'Choose an active assignee with household access';end if;
   select * into template from public.crm_workflow_templates where firm_id=p_firm and id=(p->>'template_id')::uuid;
   if not found then raise exception 'CRM_NOT_FOUND';end if;
   insert into public.crm_workflow_runs(firm_id,household_id,template_id,name,template_snapshot,created_by) values(p_firm,h,template.id,template.name,to_jsonb(template),p_actor) returning id into result_id;
   for item in select * from jsonb_array_elements(template.steps) loop
    idx=idx+1;
    task=public.crm_write(p_actor,p_firm,'task.create',jsonb_build_object('household_id',h,'title',item->>'title','details','Workflow: '||template.name||' / step '||idx::text||'. Complete earlier steps before starting this task.'||E'\n'||(item->>'details'),'assigned_to',owner,'due_on',((p->>'start_on')::date+(item->>'days')::integer)::text,'priority','normal'));
    insert into public.crm_workflow_steps(firm_id,household_id,run_id,task_id,step_order) values(p_firm,h,result_id,(task->>'id')::uuid,idx);
   end loop;
  else
   owner=(p->>'owner_id')::uuid;
   if public.crm_actor_role(p_firm,owner) is null or not public.crm_actor_can_household(p_firm,h,owner) then raise exception 'Choose an active opportunity owner with household access';end if;
   if p_action='opportunity.create' then
    insert into public.crm_opportunities(firm_id,household_id,title,stage,owner_id,potential_assets,currency,expected_close,notes,created_by,updated_by) values(p_firm,h,p->>'title',p->>'stage',owner,(p->>'potential_assets')::numeric,p->>'currency',nullif(p->>'expected_close','')::date,p->>'notes',p_actor,p_actor) returning id into result_id;
   else
    select version into current_version from public.crm_opportunities where firm_id=p_firm and household_id=h and id=(p->>'id')::uuid for update;
    if current_version is null then raise exception 'CRM_NOT_FOUND';end if;
    if current_version<>(p->>'version')::integer then raise exception 'CRM_CONFLICT';end if;
    update public.crm_opportunities set title=p->>'title',stage=p->>'stage',owner_id=owner,potential_assets=(p->>'potential_assets')::numeric,currency=p->>'currency',expected_close=nullif(p->>'expected_close','')::date,notes=p->>'notes',version=version+1,updated_by=p_actor,updated_at=now() where id=(p->>'id')::uuid returning id into result_id;
   end if;
  end if;
 else raise exception 'Unsupported practice action';end if;
 answer=jsonb_build_object('id',result_id);
 insert into public.crm_requests(actor_id,request_id,payload_hash,result) values(p_actor,p_request,fingerprint,answer);
 return answer;
end $$;
revoke all on function public.crm_practice_dispatch(uuid,uuid,text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.crm_practice_dispatch(uuid,uuid,text,jsonb,uuid) to service_role;

-- Invoker security applies existing household RLS to every aggregate.
create function public.crm_practice_report(p_firm uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
 'household_stages',coalesce((select jsonb_agg(to_jsonb(s)) from (select stage,count(*)::integer count from public.crm_households where firm_id=p_firm group by stage) s),'[]'),
 'tasks',coalesce((select jsonb_agg(to_jsonb(s)) from (select status,count(*)::integer count from public.crm_tasks where firm_id=p_firm group by status) s),'[]'),
 'overdue',(select count(*) from public.crm_tasks where firm_id=p_firm and status in ('open','in_progress') and due_on<(now() at time zone 'America/Toronto')::date),
 'reviews_due',(select count(*) from public.crm_households where firm_id=p_firm and stage<>'inactive' and review_due<=(now() at time zone 'America/Toronto')::date),
 'pipeline',coalesce((select jsonb_agg(to_jsonb(s)) from (select stage,currency,count(*)::integer count,sum(potential_assets) potential_assets from public.crm_opportunities where firm_id=p_firm group by stage,currency) s),'[]'),
 'workflow_count',(select count(*) from public.crm_workflow_runs where firm_id=p_firm));
$$;
revoke all on function public.crm_practice_report(uuid) from public,anon;
grant execute on function public.crm_practice_report(uuid) to authenticated;
