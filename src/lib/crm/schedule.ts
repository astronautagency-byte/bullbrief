import { z } from "zod";
export const meetingTypes=["annual_review","check_in","discovery","estate","other"] as const;
const text=(min:number,max:number)=>z.string().trim().min(min).max(max);
const id=z.uuid(),version=z.number().int().positive();
const url=z.union([z.literal(""),z.url().max(1500).refine(v=>{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password;},"Use a secure HTTPS meeting link.")]);
const appointment=z.object({household_id:id,owner_id:id,title:text(2,180),meeting_type:z.enum(meetingTypes),starts_at:z.iso.datetime({offset:true}),ends_at:z.iso.datetime({offset:true}),location:text(0,300),join_url:url,agenda:text(0,6000)}).refine(v=>{const duration=Date.parse(v.ends_at)-Date.parse(v.starts_at);return duration>=5*60000&&duration<=8*3600000;},"Meeting duration must be between five minutes and eight hours.");
export const scheduleActionSchema=z.object({firmId:id,requestId:id}).and(z.discriminatedUnion("action",[
 z.object({action:z.literal("appointment.create"),data:appointment}),
 z.object({action:z.literal("appointment.update"),data:appointment.extend({id,version})}),
 z.object({action:z.literal("appointment.scratchpad"),data:z.object({id,version,scratchpad:text(0,15000)})}),
 z.object({action:z.literal("appointment.status"),data:z.object({id,version,status:z.enum(["scheduled","completed","cancelled"])})}),
 z.object({action:z.literal("appointment.record"),data:z.object({id,version,attendees:text(0,1500),discussion:text(10,15000),decisions:text(0,8000),followups:z.array(z.object({title:text(2,200),details:text(0,5000).default(""),assigned_to:id,due_on:z.union([z.literal(""),z.iso.date()]),priority:z.enum(["low","normal","high"]).default("normal")})).max(10).default([]),confirmed:z.literal(true)})}),
]));
export type Appointment={household_name?:string;id:string;firm_id:string;household_id:string;owner_id:string;title:string;meeting_type:typeof meetingTypes[number];starts_at:string;ends_at:string;location:string;join_url:string;agenda:string;scratchpad:string;status:"scheduled"|"completed"|"cancelled";version:number;meeting_id:string|null};
export function torontoDate(value:string){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));}
export function calendarText(a:Appointment){
 const escape=(s:string)=>s.replaceAll("\\","\\\\").replaceAll("\r","").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;");
 const stamp=(s:string)=>new Date(s).toISOString().replaceAll(/[-:]/g,"").replace(/\.\d{3}/,"");
 // Fold by UTF-8 bytes, keeping each physical line within RFC 5545 limits.
 const fold=(s:string)=>{const lines:string[]=[];let line="",length=0;for(const char of s){const size=new TextEncoder().encode(char).length;if(length+size>73){lines.push(line);line=" ";length=1;}line+=char;length+=size;}lines.push(line);return lines.join("\r\n");};
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BullBrief//Advisor Meetings//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${a.id}@bullbrief`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(a.starts_at)}`,`DTEND:${stamp(a.ends_at)}`,`SUMMARY:${escape(a.title)}`,`LOCATION:${escape(a.location)}`,`DESCRIPTION:${escape(a.agenda+(a.join_url?"\n"+a.join_url:""))}`,`STATUS:${a.status==="cancelled"?"CANCELLED":"CONFIRMED"}`,"END:VEVENT","END:VCALENDAR"].map(fold).join("\r\n")+"\r\n";
}
