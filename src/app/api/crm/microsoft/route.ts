import { NextResponse } from "next/server";
import { z } from "zod";
import { crmSession, storageError } from "@/lib/crm/server";
import { configured } from "@/lib/microsoft/security";
import { membership } from "@/lib/microsoft/store";
import { microsoftError } from "@/lib/microsoft/response";
export async function GET(request:Request){try{
 const session=await crmSession(),q=new URL(request.url).searchParams,firm=q.get("firmId"),kind=q.get("kind")||"mail",page=Number(q.get("page")||1);
 if(!z.uuid().safeParse(firm).success||!["mail","event"].includes(kind)||!Number.isInteger(page)||page<1||page>100)return NextResponse.json({error:"Choose a valid firm and page."},{status:400});await membership(session,firm!);
 const [connection,items]=await Promise.all([
  session.client.from("crm_ms_connections").select("id,status,email,scopes,connected_at,last_sync_at,last_sync_error,lease_until,created_at").eq("firm_id",firm!).eq("user_id",session.user.id).maybeSingle(),
  session.client.from("crm_ms_items").select("id,kind,metadata,occurred_at",{count:"exact"}).eq("firm_id",firm!).eq("user_id",session.user.id).eq("kind",kind).order("occurred_at",{ascending:kind==="event"}).range((page-1)*30,page*30-1),
 ]);storageError(connection.error);storageError(items.error);
 return NextResponse.json({data:{kind,configured:configured(),syncing:!!connection.data?.lease_until&&Date.parse(connection.data.lease_until)>Date.now(),connection:connection.data,items:items.data||[],count:items.count||0,page}},{headers:{"Cache-Control":"no-store"}});
}catch(e){return microsoftError(e);}}
