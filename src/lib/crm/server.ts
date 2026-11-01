import "server-only";
import { NextResponse } from "next/server";
import { reviewSession } from "@/lib/kyp-review/store";
import { simulationWriter } from "@/lib/kyp-simulation/store";
export { reviewSession as crmSession, simulationWriter as crmWriter };
export function crmError(error: unknown) {
 const message = error instanceof Error ? error.message : "The CRM request could not be completed.";
 if (message === "AUTH_REQUIRED" || message.includes("CRM_UNAUTHORIZED")) return NextResponse.json({ error: "Sign in to access the CRM." }, { status: 401 });
 if (message.includes("CRM_FORBIDDEN")) return NextResponse.json({ error: "You do not have access to this firm, household or action." }, { status: 403 });
 if (message.includes("CRM_CONFLICT")) return NextResponse.json({ error: "This record changed in another session. Reload before saving; your edits were not applied." }, { status: 409 });
 if (message.includes("CRM_NOT_FOUND")) return NextResponse.json({ error: "CRM record not found." }, { status: 404 });
 console.error("CRM operation failed:", message);
 return NextResponse.json({ error: message.startsWith("CRM_STORAGE") ? "CRM storage is unavailable. Please retry." : message }, { status: message.startsWith("CRM_STORAGE") ? 503 : 400 });
}
export function storageError(error: { message: string; code?: string } | null) { if (error) throw new Error(error.code === "P0001" ? error.message : `CRM_STORAGE: ${error.message}`); }
export function sameOrigin(request: Request) { const origin = request.headers.get("origin"); if (origin && origin !== new URL(request.url).origin) throw new Error("CRM_FORBIDDEN"); }
