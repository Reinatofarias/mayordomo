import {z} from 'zod';
import {getContext} from '@/data/finance';
import {FinancialStewardAgent,aiEnabled} from '@/ai/financial-steward';
import {readJson,sameOrigin} from '@/lib/request';
import {rateLimit} from '@/data/rate-limit';
import {logEvent} from '@/lib/logger';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Solicitud no válida.'},{status:403});
 if(!aiEnabled())return Response.json({error:'MAYORDOMO no está disponible temporalmente.'},{status:503});
 try{
 const input=z.object({message:z.string().trim().min(1).max(4000),conversationId:z.uuid(),consent:z.literal(true)}).parse(await readJson(request));
 const c=await getContext();await rateLimit(c.db,'ai');
 const {error:consentError}=await c.db.from('consents').upsert({user_id:c.user.id,type:'AI_FINANCIAL_INFORMATION',version:'draft-1'},{onConflict:'user_id,type,version',ignoreDuplicates:true});
 if(consentError)throw new Error('Consent unavailable');
 const {data:existing,error:readError}=await c.db.from('ai_conversations').select('id').eq('id',input.conversationId).eq('user_id',c.user.id).maybeSingle();
 if(readError)throw new Error('Conversation unavailable');
 if(!existing){const {error}=await c.db.from('ai_conversations').insert({id:input.conversationId,user_id:c.user.id});if(error)throw new Error('Conversation unavailable');await c.db.rpc('record_activity',{event_type:'AI_CONVERSATION_STARTED'});}
 const {data:history,error:historyError}=await c.db.from('ai_messages').select('role,parts').eq('user_id',c.user.id).eq('conversation_id',input.conversationId).order('created_at',{ascending:false}).limit(20);
 if(historyError)throw new Error('History unavailable');
 const messages=z.array(z.object({role:z.enum(['user','assistant']),parts:z.object({text:z.string()})})).parse(history).reverse().map(m=>({role:m.role,content:m.parts.text}));
 const {error:saveError}=await c.db.from('ai_messages').insert({user_id:c.user.id,conversation_id:input.conversationId,role:'user',parts:{text:input.message}});
 if(saveError)throw new Error('Message unavailable');
 const started=Date.now();
 const result=await FinancialStewardAgent(c).stream({messages:[...messages,{role:'user',content:input.message}],abortSignal:request.signal});
 const encoder=new TextEncoder();
 return new Response(new ReadableStream({async start(controller){
 let text='';
 try{
 for await(const chunk of result.textStream){text+=chunk;controller.enqueue(encoder.encode(chunk));}
 const {error}=await c.db.from('ai_messages').insert({user_id:c.user.id,conversation_id:input.conversationId,role:'assistant',parts:{text}});
 if(error)throw new Error('Persistence unavailable');
 const usage=await result.totalUsage;logEvent('ai_complete',{durationMs:Date.now()-started,inputTokens:usage.inputTokens,outputTokens:usage.outputTokens,success:true});
 }catch{logEvent('ai_failed',{durationMs:Date.now()-started,success:false});controller.enqueue(encoder.encode('\nNo pude completar la respuesta. Inténtalo nuevamente.'));}
 finally{controller.close();}
 }}),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }catch{logEvent('ai_request_failed',{success:false});return Response.json({error:'No pudimos completar la solicitud. Revisa tu sesión e inténtalo nuevamente.'},{status:400});}
}
