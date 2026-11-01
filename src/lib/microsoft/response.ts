import { NextResponse } from "next/server";
import { MicrosoftError } from "./security";
export function microsoftError(error:unknown){
 const message=error instanceof Error?error.message:"";
 if(message==="AUTH_REQUIRED")return NextResponse.json({error:"Sign in to manage your Outlook connection."},{status:401});
 if(message.includes("CRM_FORBIDDEN"))return NextResponse.json({error:"You do not have access to this connection or firm."},{status:403});
 if(message.includes("CRM_NOT_FOUND"))return NextResponse.json({error:"Outlook connection not found."},{status:404});
 if(message.includes("CRM_CONFLICT"))return NextResponse.json({error:"The connection changed. Reload before trying again."},{status:409});
 if(message.startsWith("A sync is running"))return NextResponse.json({error:"A sync is running or was recently attempted. Wait a minute before retrying."},{status:429});
 const code=error instanceof MicrosoftError?error.code:"provider_unavailable";
 const copy={not_configured:"Microsoft 365 setup is not complete. Ask your administrator to configure the connection.",reauth_required:"Reconnect Outlook to restore access.",throttled:"Microsoft is limiting requests. Wait before trying again.",too_many_items:"This mailbox has more items than the pilot sync limit. No partial update was saved.",provider_unavailable:"Outlook could not be synchronized. Your last successful snapshot is preserved.",invalid_callback:"The connection attempt expired or could not be verified. Start again."};
 return NextResponse.json({error:copy[code],code},{status:code==="throttled"?429:code==="reauth_required"?409:503});
}
