'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {getContext} from '@/data/finance';
import {adminClient} from '@/data/admin';
import {supportAssistantReply,shouldEscalateToHuman,notifyHumanSupport} from '@/data/support';
import type {FormState} from '@/app/auth-actions';

async function getOrCreateRequest(c:Awaited<ReturnType<typeof getContext>>){
 const {data:existing}=await c.db.from('support_requests').select('id').eq('user_id',c.user.id).eq('status','OPEN').ilike('subject','Chat de soporte%').order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(existing)return existing.id as string;
 const {data,error}=await c.db.from('support_requests').insert({user_id:c.user.id,subject:'Chat de soporte',message:'Conversacion iniciada desde el chat de soporte.'}).select('id').single();
 if(error||!data)throw new Error('Support request unavailable');
 return data.id as string;
}

export async function sendSupportChatMessage(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({message:z.string().trim().min(2).max(3000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Escribe un mensaje de soporte con al menos 2 caracteres.'};
 const c=await getContext(false);const requestId=await getOrCreateRequest(c);
 const {error:userError}=await c.db.from('support_messages').insert({user_id:c.user.id,request_id:requestId,sender:'user',message:parsed.data.message});
 if(userError)return {error:'No pudimos enviar tu mensaje. Intentalo de nuevo.'};
 const service=adminClient();
 const reply=await supportAssistantReply(parsed.data.message);const escalate=shouldEscalateToHuman(parsed.data.message);
 await service.from('support_messages').insert({user_id:c.user.id,request_id:requestId,sender:'assistant',message:reply+(escalate?'\n\nTambien marque esta conversacion para revision humana.':'')});
 if(escalate){
  await service.from('notifications').insert({user_id:c.user.id,message:'Tu solicitud fue marcada para revision humana. Puedes seguir la conversacion en Ayuda.'});
  await notifyHumanSupport({email:c.user.email,subject:'MAYORDOMO: soporte humano requerido',message:parsed.data.message,requestId});
 }
 revalidatePath('/ayuda');revalidatePath('/perfil');
 return {message:escalate?'Mensaje enviado y marcado para revision humana.':'Mensaje enviado.'};
}