import "server-only";
import { crmSession, crmWriter, storageError } from "@/lib/crm/server";
export type MicrosoftSession=Awaited<ReturnType<typeof crmSession>>;
export async function membership(session:MicrosoftSession,firm:string){const result=await session.client.from("crm_members").select("role").eq("firm_id",firm).eq("user_id",session.user.id).eq("status","active").maybeSingle();storageError(result.error);if(!result.data)throw Error("CRM_FORBIDDEN");}
export async function command(user:string,firm:string|null,action:string,p:Record<string,unknown>){const{data,error}=await crmWriter().rpc("crm_ms_command",{p_actor:user,p_firm:firm,p_action:action,p});storageError(error);return data;}
