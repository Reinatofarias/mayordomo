import 'server-only';
type Metrics={durationMs?:number;inputTokens?:number;outputTokens?:number;success?:boolean;tool?:string;reason?:string;eventType?:string;productId?:string;issue?:string;errorName?:string;errorMessage?:string;statusCode?:number;code?:string;model?:string};
export function logEvent(event:string,metrics:Metrics={}) {
 console.info(JSON.stringify({event,time:new Date().toISOString(),...metrics}));
}
