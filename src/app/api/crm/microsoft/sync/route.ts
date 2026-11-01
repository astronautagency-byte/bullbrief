import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, sameOrigin } from "@/lib/crm/server";
import { microsoftClient } from "@/lib/microsoft/client";
import { cacheContext, checkOrigin, configuration, graphScopes, MicrosoftError, seal, unseal } from "@/lib/microsoft/security";
import { readSnapshot } from "@/lib/microsoft/graph";
import { command } from "@/lib/microsoft/store";
import { microsoftError } from "@/lib/microsoft/response";
export const runtime="nodejs";export const maxDuration=180;
export async function POST(request:Request){
 let lease:{generation:string;lease_id:string}|null=null,user:string|null=null,firm:string|null=null,cache:string|undefined;
 try{
  sameOrigin(request);const session=await crmSession();user=session.user.id;checkOrigin(request);const raw=await request.text();if(raw.length>1000)throw Error();const input=z.object({firmId:z.uuid()}).safeParse(JSON.parse(raw));if(!input.success)return NextResponse.json({error:"Choose a firm workspace."},{status:400});firm=input.data.firmId;
  const connection=await command(user,firm,"sync.begin",{});lease=connection;
  const context=cacheContext(user,firm,connection.generation),client=microsoftClient();client.getTokenCache().deserialize(unseal(connection.cache_ciphertext,context));
  const account=await client.getTokenCache().getAccountByHomeId(connection.account_id);if(!account||account.tenantId.toLowerCase()!==configuration().tenant.toLowerCase())throw new MicrosoftError("reauth_required");
  let token:string;try{const result=await client.acquireTokenSilent({account,scopes:graphScopes});token=result.accessToken;cache=seal(client.getTokenCache().serialize(),context);}catch{throw new MicrosoftError("reauth_required");}
  const items=await readSnapshot(token);await command(user,firm,"sync.finish",{generation:connection.generation,lease_id:connection.lease_id,cache_ciphertext:cache,items});
  return NextResponse.json({synced:items.length},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(lease&&user&&firm){try{await command(user,firm,"sync.fail",{generation:lease.generation,lease_id:lease.lease_id,code:e instanceof MicrosoftError?e.code:"provider_unavailable",...(cache?{cache_ciphertext:cache}:{})});}catch{/* Disconnect or a newer generation wins over an in-flight sync. */}}return microsoftError(e);}
}
