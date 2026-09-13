import 'server-only';
type Metrics={durationMs?:number;inputTokens?:number;outputTokens?:number;success?:boolean;tool?:string;reason?:string;eventType?:string;productId?:string;issue?:string};
export function logEvent(event:string,metrics:Metrics={}) {
 console.info(JSON.stringify({event,time:new Date().toISOString(),...metrics}));
}
