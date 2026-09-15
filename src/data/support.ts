import 'server-only';
import {generateText} from 'ai';
import {createGoogle} from '@ai-sdk/google';
import {googleApiKey} from '@/ai/financial-steward';

export function supportAdminEmails(){return (process.env.SUPPORT_ADMIN_EMAILS??process.env.ADMIN_EMAILS??'origemmediacwk@').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);}
export function isSupportAdmin(email:string|undefined|null){
 const address=(email??'').toLowerCase();
 return supportAdminEmails().some(admin=>admin.endsWith('@')?address.startsWith(admin):address===admin);
}

export function shouldEscalateToHuman(message:string){
 const lower=message.toLowerCase();
 return ['humano','persona','pessoa','admin','cancelar','reembolso','cobranza','cobranca','pago','pagamento','hotmart','error','erro','bug','no funciona','nao funciona','acceso','acesso'].some(term=>lower.includes(term));
}

export async function supportAssistantReply(message:string){
 const fallback='Gracias por contarnos. Voy a registrar tu solicitud para que el equipo pueda revisarla. Mientras tanto, no compartas contrasenas, datos bancarios ni claves privadas.';
 if(process.env.AI_ENABLED!=='true'||process.env.AI_PROVIDER!=='google'||!process.env.AI_MODEL||!googleApiKey())return fallback;
 try{
  const model=createGoogle({apiKey:googleApiKey()})(process.env.AI_MODEL);
  const result=await generateText({model,maxOutputTokens:260,prompt:`Eres soporte inicial de MAYORDOMO. Responde en espanol claro, breve y amable. No pidas contrasenas, tarjetas ni claves. Si el caso requiere humano, dilo y explica que quedara registrado. No prometas plazos exactos. Mensaje del usuario: ${message}`});
  return result.text.trim()||fallback;
 }catch{return fallback;}
}

export async function notifyHumanSupport(payload:{email?:string|null;subject:string;message:string;requestId:string}){
 const url=process.env.SUPPORT_EMAIL_WEBHOOK_URL;
 if(!url)return false;
 try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return response.ok;}catch{return false;}
}