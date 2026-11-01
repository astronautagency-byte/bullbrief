import { z } from "zod";
export const pipelineStages = ["new", "discovery", "proposal", "commitment", "won", "lost"] as const;
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const id = z.uuid(), version = z.number().int().positive();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, "Use a valid calendar date.");
const opportunity = z.object({ household_id: id, title: text(2,180), stage: z.enum(pipelineStages), owner_id: id, potential_assets: z.number().min(0).max(9999999999999.99).refine(v => Math.abs(v*100-Math.round(v*100))<0.000001), currency: z.enum(["CAD","USD"]), expected_close: z.union([z.literal(""),date]), notes: text(0,4000) });
const template = z.object({ name: text(2,120), description: text(0,1000), steps: z.array(z.object({ title: text(2,160), details: text(0,2000), days: z.number().int().min(0).max(730) })).min(1).max(20) }).refine(v => v.steps.every((s,i) => !i || s.days >= v.steps[i-1].days), "Step due dates must stay in order.");
export const practiceActionSchema = z.object({ firmId: id, requestId: id }).and(z.discriminatedUnion("action",[
 z.object({ action:z.literal("opportunity.create"),data:opportunity }),
 z.object({ action:z.literal("opportunity.update"),data:opportunity.extend({id,version}) }),
 z.object({ action:z.literal("template.create"),data:template }),
 z.object({ action:z.literal("template.update"),data:template.extend({id,version}) }),
 z.object({ action:z.literal("workflow.start"),data:z.object({household_id:id,template_id:id,assigned_to:id,start_on:date}) }),
]));
export type Opportunity = z.infer<typeof opportunity> & { id:string; version:number; updated_at:string };
export type WorkflowTemplate = z.infer<typeof template> & {id:string;version:number};
export type WorkflowStep = { id:string; task_id:string; step_order:number; title:string; status:string; due_on:string; assigned_to:string; version:number; details:string; priority:"low"|"normal"|"high"; household_id:string };
export type WorkflowRun = {id:string;household_id:string;name:string;created_at:string;steps:WorkflowStep[]};
export type PracticeReport = { household_stages:{stage:string;count:number}[]; tasks:{status:string;count:number}[]; overdue:number; reviews_due:number; pipeline:{stage:string;currency:string;count:number;potential_assets:number}[]; workflow_count:number };
export type PracticeState = { opportunities:Opportunity[];templates:WorkflowTemplate[];runs:WorkflowRun[];households:{id:string;name:string}[];report:PracticeReport };
export const starterTemplates:WorkflowTemplate[] = [
 {id:"onboarding",version:1,name:"New household onboarding",description:"Coordinate intake, documentation and the first review. Each step requires staff verification.",steps:[{title:"Confirm contact details and service scope",details:"Verify client details and record the agreed service scope. Do not infer consent from an import.",days:0},{title:"Collect current KYC and account documents",details:"Request and verify current client-specific documents using the firm's approved process.",days:3},{title:"Complete product and suitability review",details:"Complete relevant KYP work and a separate client suitability assessment with required approvals.",days:7},{title:"Schedule first household review",details:"Agree on the next meeting and confirm outstanding actions.",days:14}]},
 {id:"annual-review",version:1,name:"Annual household review",description:"A repeatable preparation and follow-up checklist.",steps:[{title:"Refresh client and account information",details:"Confirm changes to client circumstances and obtain current account evidence.",days:0},{title:"Review KYP evidence and open issues",details:"Refresh product evidence and resolve outstanding review items.",days:3},{title:"Record review meeting and decisions",details:"Document the actual discussion and agreed instructions in a meeting note.",days:7},{title:"Confirm follow-ups and next review date",details:"Assign remaining work and confirm the next service review.",days:10}]},
];
