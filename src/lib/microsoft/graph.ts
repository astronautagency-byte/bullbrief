import "server-only";
import { MicrosoftError } from "./security";
export type OutlookItem={kind:"mail"|"event";provider_id:string;occurred_at:string;metadata:Record<string,string|boolean>};
const text=(v:unknown,max=500)=>typeof v==="string"?v.slice(0,max):"";
function date(v:unknown){if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d\d:\d\d)$/.test(v)||Number.isNaN(Date.parse(v)))throw new MicrosoftError("provider_unavailable");return new Date(v).toISOString();}
function calendarDate(v:unknown){const d=v as {dateTime?:string;timeZone?:string}|null;if(!d?.dateTime)throw new MicrosoftError("provider_unavailable");return date(/(?:Z|[+-]\d\d:\d\d)$/.test(d.dateTime)?d.dateTime:d.timeZone==="UTC"?d.dateTime+"Z":"");}
function email(v:unknown){return text((v as {emailAddress?:{address?:string}}|null)?.emailAddress?.address,254);}
function webLink(v:unknown){try{const u=new URL(text(v,3000));return u.protocol==="https:"&&!u.username&&!u.password&&["outlook.office.com","outlook.office365.com","outlook.live.com"].includes(u.hostname)?u.href:"";}catch{return "";}}
export function normalizeMail(raw:Record<string,unknown>):OutlookItem{const id=text(raw.id,2048);if(!id)throw new MicrosoftError("provider_unavailable");return {kind:"mail",provider_id:id,occurred_at:date(raw.receivedDateTime),metadata:{subject:text(raw.subject)||"(No subject)",sender:email(raw.from),is_read:raw.isRead===true,web_url:webLink(raw.webLink)}};}
export function normalizeEvent(raw:Record<string,unknown>):OutlookItem{const id=text(raw.id,2048);if(!id)throw new MicrosoftError("provider_unavailable");return {kind:"event",provider_id:id,occurred_at:calendarDate(raw.start),metadata:{subject:text(raw.subject)||"(No subject)",ends_at:calendarDate(raw.end),location:text((raw.location as {displayName?:unknown}|null)?.displayName,300),organizer:email(raw.organizer),cancelled:raw.isCancelled===true,web_url:webLink(raw.webLink)}};}
export function validatedGraphUrl(value:string,path:string){let u:URL;try{u=new URL(value);}catch{throw new MicrosoftError("provider_unavailable");}if(u.origin!=="https://graph.microsoft.com"||u.pathname!==path||u.username||u.password||u.hash)throw new MicrosoftError("provider_unavailable");return u.href;}
export async function graphGet(url:string,token:string,path:string){const response=await fetch(validatedGraphUrl(url,path),{headers:{Authorization:`Bearer ${token}`,Prefer:'outlook.timezone="UTC", IdType="ImmutableId"'},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(20000)});if(response.status===401||response.status===403)throw new MicrosoftError("reauth_required");if(response.status===429)throw new MicrosoftError("throttled");if(!response.ok)throw new MicrosoftError("provider_unavailable");const data=await response.json();if(!data||typeof data!=="object")throw new MicrosoftError("provider_unavailable");return data;}
async function pages(url:string,token:string,path:string,kind:"mail"|"event"){const rows:OutlookItem[]=[];const seen=new Set<string>();let next:string|undefined=url;
 for(let page=0;next&&page<6;page++){
  const data=await graphGet(next,token,path);if(!Array.isArray(data.value))throw new MicrosoftError("provider_unavailable");
  for(const raw of data.value){const item=kind==="mail"?normalizeMail(raw):normalizeEvent(raw);if(!seen.has(item.provider_id)){rows.push(item);seen.add(item.provider_id);}if(rows.length>500)throw new MicrosoftError("too_many_items");}
  next=data["@odata.nextLink"];if(next&&typeof next!=="string")throw new MicrosoftError("provider_unavailable");
 }if(next)throw new MicrosoftError("too_many_items");return rows;
}
export function snapshotUrls(now=new Date()){
 const mailPath="/v1.0/me/mailFolders/inbox/messages",eventPath="/v1.0/me/calendarView";
 const mail=new URL("https://graph.microsoft.com"+mailPath);mail.search=new URLSearchParams({"$select":"id,subject,from,receivedDateTime,isRead,webLink","$filter":`receivedDateTime ge ${new Date(now.getTime()-14*86400000).toISOString()}`,"$orderby":"receivedDateTime desc","$top":"100"}).toString();
 const events=new URL("https://graph.microsoft.com"+eventPath);events.search=new URLSearchParams({startDateTime:new Date(now.getTime()-7*86400000).toISOString(),endDateTime:new Date(now.getTime()+30*86400000).toISOString(),"$select":"id,subject,start,end,location,organizer,isCancelled,webLink","$top":"100"}).toString();return {mail:mail.href,events:events.href,mailPath,eventPath};
}
export async function readSnapshot(token:string){const u=snapshotUrls();const results=await Promise.allSettled([pages(u.mail,token,u.mailPath,"mail"),pages(u.events,token,u.eventPath,"event")]);const error=results.find(r=>r.status==="rejected");if(error?.status==="rejected")throw error.reason;return results.flatMap(r=>r.status==="fulfilled"?r.value:[]);}
