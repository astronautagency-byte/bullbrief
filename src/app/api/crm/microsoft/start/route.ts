import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { crmSession, sameOrigin } from "@/lib/crm/server";
import { microsoftClient } from "@/lib/microsoft/client";
import { checkOrigin, configuration, digest, opaque, requestedScopes, seal } from "@/lib/microsoft/security";
import { command, membership } from "@/lib/microsoft/store";
import { microsoftError } from "@/lib/microsoft/response";
export const runtime="nodejs";
export async function POST(request:Request){try{
 sameOrigin(request);const session=await crmSession();checkOrigin(request);const raw=await request.text();if(raw.length>1000)throw Error();
 const input=z.object({firmId:z.uuid(),confirmed:z.literal(true),scheduling:z.boolean().default(false)}).safeParse(JSON.parse(raw));if(!input.success)return NextResponse.json({error:"Confirm the read-only data access before connecting."},{status:400});
 const firm=input.data.firmId;await membership(session,firm);const config=configuration(),state=opaque(),nonce=opaque(),verifier=randomBytes(48).toString("base64url"),hash=digest(state);
 const authUrl=await microsoftClient().getAuthCodeUrl({scopes:input.data.scheduling?[...requestedScopes,"Calendars.ReadWrite"]:requestedScopes,redirectUri:config.redirect,state,prompt:"select_account",codeChallenge:createHash("sha256").update(verifier).digest("base64url"),codeChallengeMethod:"S256"});
 await command(session.user.id,firm,"oauth.begin",{state_hash:hash,nonce_hash:digest(nonce),verifier_ciphertext:seal(JSON.stringify({verifier,scheduling:input.data.scheduling}),`outlook-pkce:${session.user.id}:${firm}:${hash}`)});
 const response=NextResponse.json({authUrl},{headers:{"Cache-Control":"no-store"}});response.cookies.set("bb_ms_oauth",nonce,{httpOnly:true,sameSite:"lax",secure:new URL(config.redirect).protocol==="https:",path:"/api/crm/microsoft/callback",maxAge:600});return response;
}catch(e){return microsoftError(e);}}
