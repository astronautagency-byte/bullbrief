import { NextResponse } from "next/server";
import { z } from "zod";
import { practiceActionSchema, type PracticeState, type WorkflowStep } from "@/lib/crm/practice";
import { crmError, crmSession, crmWriter, sameOrigin, storageError } from "@/lib/crm/server";
export async function GET(request: Request) {
 try {
  const session=await crmSession(), client=session.client;
  const firmId=new URL(request.url).searchParams.get("firmId"); if(!z.uuid().safeParse(firmId).success) throw Error("Choose a firm.");
  const member=await client.from("crm_members").select("role").eq("firm_id",firmId!).eq("user_id",session.user.id).eq("status","active").maybeSingle();storageError(member.error);if(!member.data)throw Error("CRM_FORBIDDEN");
  const [opportunities,templates,runs,households,report]=await Promise.all([
   client.from("crm_opportunities").select("*").eq("firm_id",firmId!).order("updated_at",{ascending:false}).limit(100),
   client.from("crm_workflow_templates").select("*").eq("firm_id",firmId!).order("name").limit(100),
   client.from("crm_workflow_runs").select("id,household_id,name,created_at").eq("firm_id",firmId!).order("created_at",{ascending:false}).limit(50),
   client.from("crm_households").select("id,name").eq("firm_id",firmId!).order("name").limit(1000),
   client.rpc("crm_practice_report",{p_firm:firmId}),
  ]);
  for(const result of [opportunities,templates,runs,households,report])storageError(result.error);
  const runRows=(runs.data||[]) as {id:string;household_id:string;name:string;created_at:string}[];
  const steps=runRows.length ? await client.from("crm_workflow_steps").select("id,run_id,step_order,task:crm_tasks(id,title,status,due_on,assigned_to,version,details,priority,household_id)").eq("firm_id",firmId!).in("run_id",runRows.map(r=>r.id)).order("step_order").limit(1000) : {data:[],error:null};storageError(steps.error);
  const stepRows=(steps.data||[]) as unknown as {id:string;run_id:string;step_order:number;task:Omit<WorkflowStep,"task_id"|"step_order">|null}[];
  const data:PracticeState={opportunities:opportunities.data||[],templates:templates.data||[],runs:runRows.map(r=>({...r,steps:stepRows.filter(s=>s.run_id===r.id&&s.task).map(s=>({...s.task!,id:s.id,task_id:s.task!.id,step_order:s.step_order}))})),households:households.data||[],report:report.data};
  return NextResponse.json({data},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return crmError(e);}
}
export async function POST(request: Request) {
 try {
  sameOrigin(request);const session=await crmSession();const raw=await request.text();if(raw.length>100000)return NextResponse.json({error:"This entry is too large."},{status:413});
  const input=practiceActionSchema.safeParse(JSON.parse(raw));if(!input.success)return NextResponse.json({error:input.error.issues[0].message},{status:400});
  const v=input.data;const{data,error}=await crmWriter().rpc("crm_practice_dispatch",{p_actor:session.user.id,p_firm:v.firmId,p_action:v.action,p:v.data,p_request:v.requestId});storageError(error);
  return NextResponse.json({data},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return crmError(e);}
}
