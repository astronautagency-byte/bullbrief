import type { CrmAction } from "./model";
/** Reuse the request ID after an uncertain network response so the server can deduplicate. */
export async function submitCrmAction(firmId:string,requestId:string,action:CrmAction["action"],data:Record<string,unknown>){
 const response=await fetch("/api/crm/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({firmId,requestId,action,data})});
 let result;try{result=await response.json();}catch{throw Error("The save response could not be read. Retry to check the same request.");}
 if(!response.ok)throw Error(result.error||"Could not save the CRM entry.");return result;
}
