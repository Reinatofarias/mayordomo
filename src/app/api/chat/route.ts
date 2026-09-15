import {z} from 'zod';
import {getCategories,getContext,getTransactions,localMonth,type getContext as getContextType} from '@/data/finance';
import {FinancialStewardAgent,aiEnabled} from '@/ai/financial-steward';
import {readJson,sameOrigin} from '@/lib/request';
import {rateLimit} from '@/data/rate-limit';
import {logEvent} from '@/lib/logger';
import {byCategory,projection,totals} from '@/domain/finance';
import {money,serializeMoney} from '@/domain/money';

type Context=Awaited<ReturnType<typeof getContextType>>;
const CHAT_TOTAL_TIMEOUT_MS=25_000;
const CHAT_FIRST_CHUNK_TIMEOUT_MS=12_000;
const CHAT_CHUNK_TIMEOUT_MS=8_000;
const USAGE_TIMEOUT_MS=1_500;

function withTimeout<T>(promise:PromiseLike<T>,ms:number){
 return Promise.race([promise,new Promise<undefined>(resolve=>setTimeout(()=>resolve(undefined),ms))]);
}

function aiErrorInfo(error:unknown){
 const record=error&&typeof error==='object'?error as Record<string,unknown>:{};
 const message=error instanceof Error?error.message:typeof error==='string'?error:'unknown';
 return {errorName:error instanceof Error?error.name:typeof record.name==='string'?record.name:'AIError',errorMessage:message.slice(0,220),statusCode:typeof record.statusCode==='number'?record.statusCode:undefined,code:typeof record.code==='string'?record.code:undefined,model:process.env.AI_MODEL};
}

function formatMinor(amountMinor:string|bigint,currency:string,locale='es-MX'){
 const value=serializeMoney(money(typeof amountMinor==='bigint'?amountMinor:BigInt(amountMinor),currency));
 return new Intl.NumberFormat(locale,{style:'currency',currency}).format(Number(value.amountDecimal));
}

async function principleLine(c:Context,question:string){
 const lower=question.toLowerCase();
 const theme=lower.includes('deuda')?'deuda':lower.includes('ahorr')||lower.includes('reserva')?'ahorro':lower.includes('don')||lower.includes('diezm')?'generosidad':lower.includes('impuls')||lower.includes('compr')?'dominio propio':'prudencia';
 const {data}=await c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme',theme).eq('active',true).maybeSingle();
 return data?`\n\nPrincipio bíblico para revisar con calma: ${data.reference}. ${data.principle} ${data.application}\n${data.risk_context}`:'';
}

async function deterministicFallback(c:Context,question:string){
 const month=localMonth(c.profile.timezone);
 const [transactions,categories]=await Promise.all([getTransactions(c,month),getCategories(c)]);
 const total=totals(transactions,c.profile.currency);
 const categoryNames=new Map(categories.map(category=>[category.id,category.name]));
 const categoryTotals=Object.entries(byCategory(transactions,c.profile.currency)).sort((a,b)=>Number(BigInt(b[1])-BigInt(a[1]))).slice(0,5);
 const expenses=formatMinor(total.expenses.amountMinor,c.profile.currency,c.profile.locale);
 const income=formatMinor(total.income.amountMinor,c.profile.currency,c.profile.locale);
 const net=formatMinor(total.net.amountMinor,c.profile.currency,c.profile.locale);
 const lower=question.toLowerCase();
 const principle=await principleLine(c,question);
 if(!transactions.length)return `Ahora mismo no veo movimientos registrados para ${month}. Para que MAYORDOMO pueda analizar tus gastos, registra al menos 2 o 3 movimientos en Movimientos y vuelve a preguntar.\n\nMientras tanto, tu perfil indica ingresos estimados de ${formatMinor(c.profile.monthly_income_minor,c.profile.currency,c.profile.locale)} y gastos fijos estimados de ${formatMinor(c.profile.fixed_expenses_minor,c.profile.currency,c.profile.locale)}.${principle}`;
 const topLine=categoryTotals.length?categoryTotals.map(([id,amount],index)=>`${index+1}. ${categoryNames.get(id)??'Categoría'}: ${formatMinor(amount,c.profile.currency,c.profile.locale)}`).join('\n'):'No hay gastos por categoría en este mes.';
 if(lower.includes('categor'))return `La categoría con más peso este mes es ${categoryTotals[0]?`${categoryNames.get(categoryTotals[0][0])??'Categoría'} con ${formatMinor(categoryTotals[0][1],c.profile.currency,c.profile.locale)}`:'no identificable todavía'}.\n\nTop categorías de gasto:\n${topLine}\n\nTotal gastado en ${month}: ${expenses}.${principle}`;
 if(lower.includes('accion')||lower.includes('acciones')||lower.includes('prudente'))return `Con los movimientos registrados en ${month}, puedes avanzar con estas tres acciones prudentes:\n\n1. Revisa la categoría más alta antes de hacer nuevos gastos: ${categoryTotals[0]?`${categoryNames.get(categoryTotals[0][0])??'Categoría'} (${formatMinor(categoryTotals[0][1],c.profile.currency,c.profile.locale)})`:'todavía faltan categorías suficientes'}.\n2. Compara tu gasto del mes (${expenses}) con tus ingresos registrados (${income}) y decide un límite semanal realista.\n3. Registra cada movimiento pequeño durante 7 días; eso mejora mucho la claridad antes de ajustar presupuesto.\n\nEsto es información educativa; tú decides los cambios.${principle}`;
 const now=new Date();
 const day=Number(new Intl.DateTimeFormat('en',{day:'numeric',timeZone:c.profile.timezone}).format(now));
 const [year,monthNumber]=month.split('-').map(Number);
 const projected=formatMinor(projection(BigInt(total.expenses.amountMinor),day,new Date(Date.UTC(year,monthNumber,0)).getUTCDate()),c.profile.currency,c.profile.locale);
 return `Así van tus gastos en ${month}:\n\n- Ingresos registrados: ${income}\n- Gastos registrados: ${expenses}\n- Balance del mes: ${net}\n- Proyección simple de gastos si mantienes el ritmo actual: ${projected}\n\nCategorías principales:\n${topLine}\n\nEsta es una lectura automática de tus datos registrados mientras revisamos la conexión con Gemini.${principle}`;
}

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
 const result=await FinancialStewardAgent(c).stream({messages:[...messages,{role:'user',content:input.message}],abortSignal:request.signal,timeout:{totalMs:CHAT_TOTAL_TIMEOUT_MS,firstChunkMs:CHAT_FIRST_CHUNK_TIMEOUT_MS,chunkMs:CHAT_CHUNK_TIMEOUT_MS,toolMs:CHAT_CHUNK_TIMEOUT_MS}});
 const encoder=new TextEncoder();
 return new Response(new ReadableStream({async start(controller){
 let text='';
 try{
 for await(const chunk of result.textStream){text+=chunk;controller.enqueue(encoder.encode(chunk));}
 const {error}=await c.db.from('ai_messages').insert({user_id:c.user.id,conversation_id:input.conversationId,role:'assistant',parts:{text}});
 if(error)throw new Error('Persistence unavailable');
 const usage=await withTimeout(result.totalUsage,USAGE_TIMEOUT_MS);logEvent('ai_complete',{durationMs:Date.now()-started,inputTokens:usage?.inputTokens,outputTokens:usage?.outputTokens,success:true,model:process.env.AI_MODEL});
 }catch(error){const info=aiErrorInfo(error);logEvent('ai_failed',{durationMs:Date.now()-started,success:false,...info});try{text=await deterministicFallback(c,input.message);controller.enqueue(encoder.encode(text));const {error:persistError}=await c.db.from('ai_messages').insert({user_id:c.user.id,conversation_id:input.conversationId,role:'assistant',parts:{text}});if(persistError)throw new Error('Fallback persistence unavailable');logEvent('ai_fallback_complete',{durationMs:Date.now()-started,success:true,model:process.env.AI_MODEL});}catch(fallbackError){logEvent('ai_fallback_failed',{durationMs:Date.now()-started,success:false,...aiErrorInfo(fallbackError)});controller.enqueue(encoder.encode('\nNo pude completar la respuesta. Ya registramos el error para revisión. Inténtalo nuevamente en unos minutos.'));}}
 finally{controller.close();}
 }}),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }catch(error){logEvent('ai_request_failed',{success:false,...aiErrorInfo(error)});return Response.json({error:'No pudimos completar la solicitud. Revisa tu sesión e inténtalo nuevamente.'},{status:400});}
}
