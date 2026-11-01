import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, sameOrigin } from "@/lib/crm/server";
import { command } from "@/lib/microsoft/store";
import { microsoftError } from "@/lib/microsoft/response";
export async function POST(request:Request){try{
 sameOrigin(request);const session=await crmSession();const raw=await request.text();if(raw.length>1000)throw Error();const input=z.object({firmId:z.uuid(),confirmed:z.literal(true)}).safeParse(JSON.parse(raw));if(!input.success)return NextResponse.json({error:"Confirm removal of your private Outlook connection and cached items."},{status:400});
 try{await command(session.user.id,input.data.firmId,"disconnect",{});}catch(e){if(!(e instanceof Error&&e.message.includes("CRM_NOT_FOUND")))throw e;}
 return NextResponse.json({disconnected:true},{headers:{"Cache-Control":"no-store"}});
}catch(e){return microsoftError(e);}}
