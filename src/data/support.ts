import 'server-only';
import {generateText} from 'ai';
import {createGoogle} from '@ai-sdk/google';
import {googleApiKey} from '@/ai/financial-steward';
import {languageFromLocale} from '@/i18n/app';

export function supportAdminEmails(){return (process.env.SUPPORT_ADMIN_EMAILS??process.env.ADMIN_EMAILS??'origemmediacwk@').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);}
export function isSupportAdmin(email:string|undefined|null){
 const address=(email??'').toLowerCase();
 return supportAdminEmails().some(admin=>admin.endsWith('@')?address.startsWith(admin):address===admin);
}

export function shouldEscalateToHuman(message:string,humanRequested=false){
 if(humanRequested)return true;
 const lower=message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return ['humano','persona','pessoa','admin','atendente','cancelar','reembolso','cobranza','cobranca','pago','pagamento','hotmart','error','erro','bug','no funciona','nao funciona','acceso','acesso','login','compra'].some(term=>lower.includes(term));
}

const fallback={
 es:'Gracias por contarnos. Voy a registrar tu solicitud para que el equipo pueda revisarla. Mientras tanto, no compartas contrasenas, datos bancarios ni claves privadas.',
 pt:'Obrigado por contar. Vou registrar sua solicitacao para que a equipe possa revisar. Enquanto isso, nao compartilhe senhas, dados bancarios nem chaves privadas.'
};

export async function supportAssistantReply(message:string,locale='es-MX',willEscalate=false){
 const lang=languageFromLocale(locale);
 if(process.env.AI_ENABLED!=='true'||process.env.AI_PROVIDER!=='google'||!process.env.AI_MODEL||!googleApiKey())return fallback[lang];
 try{
  const model=createGoogle({apiKey:googleApiKey()})(process.env.AI_MODEL);
  const language=lang==='pt'?'portugues do Brasil':'espanol claro';
  const escalation=willEscalate?'El caso tambien quedara marcado para revision humana despues de esta respuesta.':'Solo indica revision humana si el usuario lo pidio o si el caso parece requerir acceso, pago, error tecnico o cancelacion.';
  const result=await generateText({model,maxOutputTokens:280,prompt:`Eres soporte inicial de MAYORDOMO. Responde en ${language}, breve, amable y practico. No pidas contrasenas, datos completos de tarjeta, codigos bancarios ni tokens. No prometas plazos exactos. ${escalation}\n\nMensaje del usuario: ${message}`});
  return result.text.trim()||fallback[lang];
 }catch{return fallback[lang];}
}

function supportEmailText(payload:{email?:string|null;subject:string;message:string;requestId:string;locale?:string}){
 return [payload.subject,'',`Usuario: ${payload.email??'sem e-mail'}`,`Request ID: ${payload.requestId}`,`Locale: ${payload.locale??'n/a'}`,'','Mensagem:',payload.message,'','Acesse o painel admin de suporte para responder dentro do MAYORDOMO.'].join('\n');
}

async function notifyViaResend(payload:{email?:string|null;subject:string;message:string;requestId:string;locale?:string}){
 const apiKey=process.env.RESEND_API_KEY,from=process.env.SUPPORT_EMAIL_FROM;
 const to=supportAdminEmails().filter(email=>email.includes('@')&&!email.endsWith('@'));
 if(!apiKey||!from||!to.length)return false;
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`support-${payload.requestId}`},body:JSON.stringify({from,to,subject:payload.subject,text:supportEmailText(payload)})});
  return response.ok;
 }catch{return false;}
}

async function notifyViaWebhook(payload:{email?:string|null;subject:string;message:string;requestId:string;locale?:string}){
 const url=process.env.SUPPORT_EMAIL_WEBHOOK_URL;
 if(!url)return false;
 const body={...payload,adminEmails:supportAdminEmails(),source:'mayordomo-support-chat',createdAt:new Date().toISOString()};
 try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return response.ok;}catch{return false;}
}

export async function notifyHumanSupport(payload:{email?:string|null;subject:string;message:string;requestId:string;locale?:string}){
 return await notifyViaWebhook(payload)||await notifyViaResend(payload);
}