import "server-only";
import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import { configuration, graphScopes } from "./security";
export function microsoftClient(){const c=configuration();return new ConfidentialClientApplication({auth:{clientId:c.client,authority:`https://login.microsoftonline.com/${c.tenant}`,clientSecret:c.secret},system:{loggerOptions:{logLevel:LogLevel.Error,piiLoggingEnabled:false,loggerCallback:()=>{}}}});}
export function validateScopes(scopes:string[]){const granted=scopes.map(s=>s.toLowerCase().replace("https://graph.microsoft.com/",""));return graphScopes.every(s=>granted.includes(s.toLowerCase()));}
