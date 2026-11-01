import { z } from "zod";
export const invitationSchema=z.object({firmId:z.uuid(),appointment_id:z.uuid(),version:z.number().int().positive(),contact_ids:z.array(z.uuid()).min(1).max(20),contact_versions:z.record(z.string(),z.number().int().positive()),client_agenda:z.string().trim().max(6000),teams:z.boolean(),confirmed:z.literal(true)});
export type InvitationPayload={title:string;starts_at:string;ends_at:string;location:string;agenda:string;teams:boolean;join_url:string};
export type Recipient={id:string;name:string;email:string};
export function outlookEvent(id:string,p:InvitationPayload,recipients:Recipient[]){
 return {transactionId:id,subject:p.title,body:{contentType:"text",content:p.agenda+(p.join_url&&!p.teams?"\n\nJoin meeting: "+p.join_url:"")},start:{dateTime:new Date(p.starts_at).toISOString(),timeZone:"UTC"},end:{dateTime:new Date(p.ends_at).toISOString(),timeZone:"UTC"},location:{displayName:p.location},attendees:Array.from(new Map(recipients.map(r=>[r.email.toLowerCase(),r])).values()).map(r=>({emailAddress:{address:r.email,name:r.name},type:"required"})),isOnlineMeeting:p.teams,...(p.teams?{onlineMeetingProvider:"teamsForBusiness"}:{})};
}
export function safeProviderUrl(value:unknown,kind:"join"|"web"){
 if(typeof value!=="string")return "";try{const u=new URL(value);const hosts=kind==="join"?["teams.microsoft.com","teams.cloud.microsoft"]:["outlook.office.com","outlook.office365.com","outlook.live.com"];return u.protocol==="https:"&&!u.username&&!u.password&&hosts.includes(u.hostname)?value:"";}catch{return "";}
}

export function invitationReadiness(state:{configured:boolean;connection:{status:string;scopes:string[]}|null}|null){
 if(!state)return {ready:false,reason:"Checking Outlook scheduling…"};
 if(!state.configured)return {ready:false,reason:"Microsoft administrator setup required"};
 if(!state.connection)return {ready:false,reason:"Connect the meeting owner’s Outlook account"};
 if(state.connection.status!=="connected")return {ready:false,reason:"Reconnect Outlook to enable invitations"};
 if(!state.connection.scopes.some(s=>s.toLowerCase().replace("https://graph.microsoft.com/","")==="calendars.readwrite"))return {ready:false,reason:"Enable calendar-write permission in Outlook setup"};
 return {ready:true,reason:"Outlook scheduling ready"};
}
