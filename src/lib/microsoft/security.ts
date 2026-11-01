import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
export const graphScopes=["User.Read","Mail.ReadBasic","Calendars.ReadBasic"];
export const requestedScopes=[...graphScopes,"offline_access"];
export class MicrosoftError extends Error { constructor(public code:"not_configured"|"reauth_required"|"throttled"|"too_many_items"|"provider_unavailable"|"invalid_callback"){super(code);} }
export function configuration(){
 const client=process.env.MICROSOFT_CLIENT_ID,tenant=process.env.MICROSOFT_TENANT_ID,secret=process.env.MICROSOFT_CLIENT_SECRET,redirect=process.env.MICROSOFT_REDIRECT_URI,key=process.env.MICROSOFT_TOKEN_ENCRYPTION_KEY;
 if(!z.uuid().safeParse(client).success||!z.uuid().safeParse(tenant).success||!secret||!redirect||!key)throw new MicrosoftError("not_configured");
 let url:URL;try{url=new URL(redirect);}catch{throw new MicrosoftError("not_configured");}
 if(url.username||url.password||url.search||url.hash||url.pathname!=="/api/crm/microsoft/callback"||!(url.protocol==="https:"||url.protocol==="http:"&&url.hostname==="localhost")||!/^([a-f0-9]{64})$/i.test(key))throw new MicrosoftError("not_configured");
 return {client:client!,tenant:tenant!,secret,redirect,key:Buffer.from(key,"hex"),origin:url.origin};
}
export function configured(){try{configuration();return true;}catch{return false;}}
export const digest=(s:string)=>createHash("sha256").update(s).digest("hex");
export const opaque=()=>randomBytes(32).toString("hex");
export function seal(value:string,context:string){const key=configuration().key,iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);cipher.setAAD(Buffer.from(context));const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return ["v1",iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".");}
export function unseal(value:string,context:string){try{const[v,iv,tag,data]=value.split(".");if(v!=="v1"||!data)throw Error();const cipher=createDecipheriv("aes-256-gcm",configuration().key,Buffer.from(iv,"base64url"));cipher.setAAD(Buffer.from(context));cipher.setAuthTag(Buffer.from(tag,"base64url"));return Buffer.concat([cipher.update(Buffer.from(data,"base64url")),cipher.final()]).toString("utf8");}catch{throw new MicrosoftError("reauth_required");}}
export function checkOrigin(request:Request){if(new URL(request.url).origin!==configuration().origin)throw new MicrosoftError("not_configured");}
export const cacheContext=(user:string,firm:string,generation:string)=>`outlook-cache:${user}:${firm}:${generation}`;
