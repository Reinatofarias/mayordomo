import {WhatsAppProvider} from '@/integrations/messaging/whatsapp';
import {adminClient} from '@/data/admin';
import {logEvent} from '@/lib/logger';
export async function GET(request:Request){
 if(process.env.WHATSAPP_ENABLED!=='true')return new Response(null,{status:404});
 const params=new URL(request.url).searchParams;
 if(params.get('hub.mode')!=='subscribe'||!process.env.WHATSAPP_VERIFY_TOKEN||params.get('hub.verify_token')!==process.env.WHATSAPP_VERIFY_TOKEN)return new Response(null,{status:403});
 return new Response(params.get('hub.challenge')??'');
}
export async function POST(request:Request){
 if(process.env.WHATSAPP_ENABLED!=='true')return new Response(null,{status:404});
 const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const result=await reader.read();if(result.done)break;length+=result.value.length;if(length>128000){await reader.cancel();return new Response(null,{status:413});}chunks.push(result.value);}
 const raw=Buffer.concat(chunks);const provider=new WhatsAppProvider(process.env.WHATSAPP_APP_SECRET??'');
 if(!provider.verify(raw,request.headers.get('x-hub-signature-256')))return new Response(null,{status:401});
 try{
 const messages=provider.normalize(JSON.parse(raw.toString('utf8')));
 for(const message of messages){const {error}=await adminClient().rpc('receive_whatsapp_event',{event_data:message});if(error)throw new Error('Inbox unavailable');}
 return Response.json({received:true});
 }catch{logEvent('whatsapp_webhook_failed',{success:false});return new Response(null,{status:503});}
}

