'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {getContext} from '@/data/finance';
import {adminClient} from '@/data/admin';
import {languageFromLocale} from '@/i18n/app';
import {supportAssistantReply,shouldEscalateToHuman,notifyHumanSupport} from '@/data/support';
import type {FormState} from '@/app/auth-actions';

type SupportRequestRow={id:string;status:string};

async function getOrCreateRequest(c:Awaited<ReturnType<typeof getContext>>):Promise<SupportRequestRow>{
 const {data:existing}=await c.db.from('support_requests').select('id,status').eq('user_id',c.user.id).in('status',['OPEN','REVIEW_REQUIRED']).ilike('subject','Chat de soporte%').order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(existing)return existing as SupportRequestRow;
 const {data,error}=await c.db.from('support_requests').insert({user_id:c.user.id,subject:'Chat de soporte',message:'Conversación iniciada desde el chat de soporte.'}).select('id,status').single();
 if(error||!data)throw new Error('Support request unavailable');
 return data as SupportRequestRow;
}

const copy={
 es:{invalid:'Escribe un mensaje de soporte con al menos 2 caracteres.',sendError:'No pudimos enviar tu mensaje. Inténtalo de nuevo.',escalatedNote:'También marqué esta conversación para revisión humana.',notification:'Tu solicitud fue marcada para revisión humana. Puedes seguir la conversación en Ayuda.',emailSubject:'MAYORDOMO: soporte humano requerido',sent:'Mensaje enviado.',sentEscalated:'Mensaje enviado y marcado para revisión humana.'},
 pt:{invalid:'Escreva uma mensagem de suporte com pelo menos 2 caracteres.',sendError:'Não conseguimos enviar sua mensagem. Tente novamente.',escalatedNote:'Também marquei esta conversa para revisão humana.',notification:'Sua solicitação foi marcada para revisão humana. Você pode acompanhar a conversa em Ajuda.',emailSubject:'MAYORDOMO: suporte humano solicitado',sent:'Mensagem enviada.',sentEscalated:'Mensagem enviada e marcada para revisão humana.'}
};

export async function sendSupportChatMessage(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({message:z.string().trim().min(2).max(3000),humanRequested:z.string().optional()}).safeParse(Object.fromEntries(form));
 const c=await getContext(false);const t=copy[languageFromLocale(c.profile.locale)];
 if(!parsed.success)return {error:t.invalid};
 const request=await getOrCreateRequest(c);const requestId=request.id;
 const humanRequested=parsed.data.humanRequested==='true';const escalate=shouldEscalateToHuman(parsed.data.message,humanRequested);
 const {error:userError}=await c.db.from('support_messages').insert({user_id:c.user.id,request_id:requestId,sender:'user',message:parsed.data.message});
 if(userError)return {error:t.sendError};
 const service=adminClient();
 const reply=await supportAssistantReply(parsed.data.message,c.profile.locale,escalate);
 await service.from('support_messages').insert({user_id:c.user.id,request_id:requestId,sender:'assistant',message:reply+(escalate?`\n\n${t.escalatedNote}`:'')});
 if(escalate){
  await service.from('support_requests').update({status:'REVIEW_REQUIRED'}).eq('id',requestId).eq('user_id',c.user.id);
  await service.from('notifications').insert({user_id:c.user.id,message:t.notification});
  if(request.status!=='REVIEW_REQUIRED')await notifyHumanSupport({email:c.user.email,subject:t.emailSubject,message:parsed.data.message,requestId,locale:c.profile.locale});
 }
 revalidatePath('/','layout');revalidatePath('/ayuda');revalidatePath('/perfil');revalidatePath('/admin/soporte');
 return {message:escalate?t.sentEscalated:t.sent};
}