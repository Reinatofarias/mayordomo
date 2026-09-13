import {z} from 'zod';
import {HotmartPaymentProvider} from '@/integrations/payments/hotmart';
import {adminClient} from '@/data/admin';
import {readJson} from '@/lib/request';
import {logEvent} from '@/lib/logger';
export async function POST(request:Request){
 if(process.env.HOTMART_ENABLED!=='true')return new Response(null,{status:404});
 const provider=new HotmartPaymentProvider(process.env.HOTMART_WEBHOOK_TOKEN??'');
 let payload:unknown;
 try{payload=await readJson(request,128000);}catch{logEvent('payment_webhook_invalid',{success:false});return new Response(null,{status:422});}
 if(!provider.verify(request.headers,payload))return new Response(null,{status:401});
 try{
 const policy=z.object({productIds:z.array(z.string().min(1)).min(1),accessMode:z.enum(['FIXED_DAYS','PROVIDER_PERIOD']),accessDays:z.number().int().min(1).max(3660).optional()}).parse({productIds:(process.env.HOTMART_PRODUCT_IDS??'').split(',').filter(Boolean),accessMode:process.env.HOTMART_ACCESS_MODE,accessDays:process.env.HOTMART_ACCESS_DAYS?Number(process.env.HOTMART_ACCESS_DAYS):undefined});
 const event=provider.normalize(payload,policy);
 const {data,error}=await adminClient().rpc('process_payment_event',{p_event:event});
 if(error){logEvent('payment_webhook_failed',{success:false});return new Response(null,{status:503});}
 return Response.json({received:true,status:data});
 }catch{logEvent('payment_webhook_invalid',{success:false});return new Response(null,{status:422});}
}
