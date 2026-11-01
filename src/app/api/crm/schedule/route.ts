import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleActionSchema } from "@/lib/crm/schedule";
import { crmError, crmSession, crmWriter, sameOrigin, storageError } from "@/lib/crm/server";
export async function GET(request:Request){try{
 const session=await crmSession(),q=new URL(request.url).searchParams;
 const firm=q.get("firmId"),from=q.get("from"),to=q.get("to"),household=q.get("householdId");
 if(household&&!z.uuid().safeParse(household).success)return NextResponse.json({error:"Choose a valid client."},{status:400});
 if(!z.uuid().safeParse(firm).success||!from||!to||!z.iso.datetime({offset:true}).safeParse(from).success||!z.iso.datetime({offset:true}).safeParse(to).success||Date.parse(to)<=Date.parse(from)||Date.parse(to)-Date.parse(from)>33*86400000)throw Error("Choose a valid calendar range of up to 32 days.");
 const membership=await session.client.from("crm_members").select("role").eq("firm_id",firm!).eq("user_id",session.user.id).eq("status","active").maybeSingle();storageError(membership.error);if(!membership.data)throw Error("CRM_FORBIDDEN");
 let query=session.client.from("crm_appointments").select("*,household:crm_households(name)",{count:"exact"}).eq("firm_id",firm!).gte("starts_at",from).lt("starts_at",to).order("starts_at").limit(250);if(household)query=query.eq("household_id",household);const result=await query;storageError(result.error);
 return NextResponse.json({data:(result.data||[]).map(row=>{const {household,...appointment}=row;return {...appointment,household_name:(household as {name:string}|null)?.name||"Household"};}),count:result.count},{headers:{"Cache-Control":"no-store"}});
}catch(e){return crmError(e);}}
export async function POST(request:Request){try{
 sameOrigin(request);const session=await crmSession();const raw=await request.text();if(raw.length>80000)return NextResponse.json({error:"This meeting entry is too large."},{status:413});
 const input=scheduleActionSchema.safeParse(JSON.parse(raw));if(!input.success)return NextResponse.json({error:input.error.issues[0].message},{status:400});
 const v=input.data;const{data,error}=await crmWriter().rpc("crm_schedule_dispatch",{p_actor:session.user.id,p_firm:v.firmId,p_action:v.action,p:v.data,p_request:v.requestId});storageError(error);
 return NextResponse.json({data},{headers:{"Cache-Control":"no-store"}});
}catch(e){return crmError(e);}}
