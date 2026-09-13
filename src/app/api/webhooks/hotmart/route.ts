import {z} from 'zod';
import {HotmartPaymentProvider} from '@/integrations/payments/hotmart';
import {adminClient} from '@/data/admin';
import {readJson} from '@/lib/request';
import {logEvent} from '@/lib/logger';
const policySchema=z.object({productIds:z.array(z.string().min(1)).min(1),accessMode:z.enum(['FIXED_DAYS','PROVIDER_PERIOD']).default('FIXED_DAYS'),accessDays:z.number().int().min(1).max(3660).default(30)});
function payloadSummary(payload:unknown){
 if(!payload||typeof payload!=='object')return {};
 const event=(payload as {event?:unknown}).event;
 const data=(payload as {data?:unknown}).data;
 const directProduct=data&&typeof data==='object'?(data as {product?:unknown}).product:null;
 const subscription=data&&typeof data==='object'?(data as {subscription?:unknown}).subscription:null;
 const subscriptionProduct=subscription&&typeof subscription==='object'?(subscription as {product?:unknown}).product:null;
 const product=directProduct??subscriptionProduct;
 const productId=product&&typeof product==='object'?(product as {id?:unknown}).id:null;
 return {eventType:typeof event==='string'?event:undefined,productId:typeof productId==='string'||typeof productId==='number'?String(productId):undefined};
}
function webhookInvalid(error:unknown,payload:unknown){
 const summary=payloadSummary(payload);let reason='invalid_payload';
 if(error instanceof z.ZodError)reason='invalid_payload';
 else if(error instanceof Error&&error.message==='Product not configured')reason='product_not_configured';
 else if(error instanceof Error&&error.message==='Product not provided')reason='product_not_provided';
 else if(error instanceof Error&&error.message==='Access period not provided')reason='access_period_not_provided';
 else if(error instanceof Error&&error.message==='Access policy not configured')reason='access_policy_not_configured';
 logEvent('payment_webhook_invalid',{success:false,reason,...summary});
 return Response.json({received:false,error:reason,...summary},{status:422});
}
function hotmartPolicy(){
 const accessMode=(process.env.HOTMART_ACCESS_MODE??'FIXED_DAYS').trim().toUpperCase();
 const accessDays=Number((process.env.HOTMART_ACCESS_DAYS??'30').trim());
 return policySchema.parse({productIds:(process.env.HOTMART_PRODUCT_IDS??'').split(',').map(item=>item.trim()).filter(Boolean),accessMode,accessDays});
}
export async function POST(request:Request){
 if(process.env.HOTMART_ENABLED!=='true')return new Response(null,{status:404});
 const provider=new HotmartPaymentProvider(process.env.HOTMART_WEBHOOK_TOKEN??'');
 let payload:unknown;
 try{payload=await readJson(request,128000);}catch{logEvent('payment_webhook_invalid',{success:false,reason:'invalid_json'});return Response.json({received:false,error:'invalid_json'},{status:422});}
 if(!provider.verify(request.headers,payload))return new Response(null,{status:401});
 try{
 const policy=hotmartPolicy();
 const event=provider.normalize(payload,policy);
 const {data,error}=await adminClient().rpc('process_payment_event',{p_event:event});
 if(error){logEvent('payment_webhook_failed',{success:false});return new Response(null,{status:503});}
 return Response.json({received:true,status:data});
 }catch(error){return webhookInvalid(error,payload);}
}
