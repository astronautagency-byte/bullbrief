import { NextResponse, type NextRequest } from "next/server";
import { crmSession } from "@/lib/crm/server";
import { microsoftClient, validateScopes } from "@/lib/microsoft/client";
import { cacheContext, checkOrigin, configuration, digest, MicrosoftError, requestedScopes, seal, unseal } from "@/lib/microsoft/security";
import { graphGet } from "@/lib/microsoft/graph";
import { command } from "@/lib/microsoft/store";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 let origin=new URL(request.url).origin;let attempt:{firm_id:string;generation:string}|null=null;let user:string|null=null;let status="connection_failed";
 try{
  const config=configuration();origin=config.origin;checkOrigin(request);const session=await crmSession();user=session.user.id;
  const q=new URL(request.url).searchParams,state=q.get("state"),nonce=request.cookies.get("bb_ms_oauth")?.value;
  if(!state||!nonce||!/^([a-f0-9]{64})$/.test(state)||!/^([a-f0-9]{64})$/.test(nonce))throw new MicrosoftError("invalid_callback");
  const consumed=await command(user,null,"oauth.consume",{state_hash:digest(state),nonce_hash:digest(nonce)});attempt=consumed;
  const code=q.get("code");if(q.get("error")||!code||code.length>10000)throw new MicrosoftError("invalid_callback");
  const stored=unseal(consumed.verifier_ciphertext,`outlook-pkce:${user}:${consumed.firm_id}:${digest(state)}`),client=microsoftClient();
  const proof=stored.startsWith("{")?JSON.parse(stored):{verifier:stored,scheduling:false};
  if(typeof proof.verifier!=="string"||proof.verifier.length<43)throw new MicrosoftError("invalid_callback");
  const scopes=proof.scheduling===true?[...requestedScopes,"Calendars.ReadWrite"]:requestedScopes;
  const result=await client.acquireTokenByCode({code,redirectUri:config.redirect,scopes,codeVerifier:proof.verifier});
  if(!result?.account||result.account.tenantId.toLowerCase()!==config.tenant.toLowerCase()||!validateScopes(result.scopes)||proof.scheduling===true&&!result.scopes.some(s=>s.toLowerCase().endsWith("calendars.readwrite")))throw new MicrosoftError("invalid_callback");
  const profile=await graphGet("https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName",result.accessToken,"/v1.0/me");
  const email=typeof profile.mail==="string"?profile.mail:typeof profile.userPrincipalName==="string"?profile.userPrincipalName:result.account.username;
  await command(user,consumed.firm_id,"oauth.complete",{generation:consumed.generation,cache_ciphertext:seal(client.getTokenCache().serialize(),cacheContext(user,consumed.firm_id,consumed.generation)),account_id:result.account.homeAccountId,email:email.slice(0,254),tenant_id:result.account.tenantId,scopes:result.scopes});status="connected";
 }catch{if(attempt&&user){try{await command(user,attempt.firm_id,"oauth.fail",{generation:attempt.generation});}catch{/* No credentials or provider errors are logged. */}}}
 const target=new URL("/connections",origin);target.searchParams.set("status",status);if(attempt)target.searchParams.set("firmId",attempt.firm_id);
 const response=NextResponse.redirect(target,303);response.headers.set("Cache-Control","no-store");response.headers.set("Referrer-Policy","no-referrer");response.cookies.set("bb_ms_oauth","",{httpOnly:true,sameSite:"lax",secure:origin.startsWith("https:"),path:"/api/crm/microsoft/callback",maxAge:0});return response;
}
