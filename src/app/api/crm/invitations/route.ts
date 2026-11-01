import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, crmWriter, sameOrigin, storageError } from "@/lib/crm/server";
import { cacheContext, checkOrigin, configuration, MicrosoftError, seal, unseal } from "@/lib/microsoft/security";
import { microsoftClient } from "@/lib/microsoft/client";
import { invitationSchema, outlookEvent, safeProviderUrl } from "@/lib/microsoft/invitations";
import { microsoftError } from "@/lib/microsoft/response";
export const runtime="nodejs";
const select="id,appointment_id,firm_id,household_id,sender_id,recipients,status,join_url,web_url,accepted_at,created_at";
export async function GET(request:Request){try{
 const session=await crmSession(),q=new URL(request.url).searchParams,firm=q.get("firmId"),id=q.get("appointmentId");if(!z.uuid().safeParse(firm).success||!z.uuid().safeParse(id).success)return NextResponse.json({error:"Choose a meeting."},{status:400});
 const result=await session.client.from("crm_meeting_invitations").select(select).eq("firm_id",firm!).eq("appointment_id",id!).maybeSingle();storageError(result.error);return NextResponse.json({data:result.data},{headers:{"Cache-Control":"no-store"}});
}catch(e){return microsoftError(e);}}
export async function POST(request:Request){
 let receipt:{id:string;lease_id:string}|null=null,actor="",firm="",appointment="",attempted=false;
 const writer=crmWriter();
 async function command(action:string,p:Record<string,unknown>){const r=await writer.rpc("crm_invitation_command",{p_actor:actor,p_firm:firm,p_action:action,p:{appointment_id:appointment,...p}});storageError(r.error);return r.data;}
 try{
 sameOrigin(request);const session=await crmSession();actor=session.user.id;checkOrigin(request);const raw=await request.text();if(raw.length>15000)return NextResponse.json({error:"Invitation is too large."},{status:413});const parsed=invitationSchema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:"Review the meeting and select valid client contacts before sending."},{status:400});const v=parsed.data;firm=v.firmId;appointment=v.appointment_id;
 // RLS verifies household access before private credentials are read by the server.
 const a=await session.client.from("crm_appointments").select("id,owner_id").eq("firm_id",firm).eq("id",appointment).maybeSingle();storageError(a.error);if(!a.data||a.data.owner_id!==actor)throw Error("CRM_FORBIDDEN");
 const connection=await writer.from("crm_ms_connections").select("id,generation,status,cache_ciphertext,account_id,scopes").eq("firm_id",firm).eq("user_id",actor).maybeSingle();storageError(connection.error);const c=connection.data;
 if(!c||c.status!=="connected"||!c.scopes.some((s:string)=>s.toLowerCase().endsWith("calendars.readwrite")))return NextResponse.json({error:"Enable meeting scheduling and reconnect Outlook in Email & Calendar before sending invitations."},{status:409});
 const context=cacheContext(actor,firm,c.generation),client=microsoftClient();client.getTokenCache().deserialize(unseal(c.cache_ciphertext,context));const account=await client.getTokenCache().getAccountByHomeId(c.account_id);if(!account||account.tenantId.toLowerCase()!==configuration().tenant.toLowerCase())throw new MicrosoftError("reauth_required");
 let token:string;try{const r=await client.acquireTokenSilent({account,scopes:["User.Read","Calendars.ReadWrite"]});token=r.accessToken;}catch{throw new MicrosoftError("reauth_required");}
 const rotated=await writer.from("crm_ms_connections").update({cache_ciphertext:seal(client.getTokenCache().serialize(),context)}).eq("id",c.id).eq("generation",c.generation).eq("status","connected");storageError(rotated.error);
 const i=await command("begin",{version:v.version,contact_ids:v.contact_ids,contact_versions:v.contact_versions,client_agenda:v.client_agenda,teams:v.teams});
 if(!i.lease_id)return NextResponse.json({status:i.status,repeated:true},{headers:{"Cache-Control":"no-store"}});receipt=i;
 const stillConnected=await writer.from("crm_ms_connections").select("id").eq("id",c.id).eq("generation",c.generation).eq("status","connected").maybeSingle();storageError(stillConnected.error);if(!stillConnected.data)throw new MicrosoftError("reauth_required");
 attempted=true;
 const response=await fetch("https://graph.microsoft.com/v1.0/me/events",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",Prefer:'IdType="ImmutableId"'},body:JSON.stringify(outlookEvent(i.id,i.payload,i.recipients)),redirect:"error",cache:"no-store",signal:AbortSignal.timeout(25000)});
 if(!response.ok){const definite=[400,401,403,404,422,429].includes(response.status);await command(definite?"rejected":"uncertain",{lease_id:i.lease_id});return NextResponse.json({error:definite?"Microsoft rejected the invitation. No acceptance was recorded. Check account permissions and meeting details.":"Microsoft's response is uncertain. Check the organizer's Outlook calendar before taking further action.",status:definite?"rejected":"uncertain"},{status:502});}
 const event=await response.json();if(typeof event.id!=="string")throw Error("Missing provider receipt");
 const join=safeProviderUrl(event.onlineMeeting?.joinUrl,"join"),web=safeProviderUrl(event.webLink,"web");await command("accepted",{lease_id:i.lease_id,provider_id:event.id,join_url:join,web_url:web});
 return NextResponse.json({status:"accepted",join_url:join,web_url:web,link_pending:v.teams&&!join},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(receipt){try{await command(attempted?"uncertain":"rejected",{lease_id:receipt.lease_id});}catch{/* Durable sending receipt blocks duplicate submissions even if finalization fails. */}return NextResponse.json({error:attempted?"The result is uncertain. Check Outlook before sending another invitation.":"The invitation was not submitted to Microsoft. Reconnect Outlook and check the meeting details.",status:attempted?"uncertain":"rejected"},{status:502});}return microsoftError(e);}
}
