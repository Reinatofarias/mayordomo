'use server';
import {z} from 'zod';
import {getContext} from '@/data/finance';
import type {FormState} from '@/app/auth-actions';
import {rateLimit} from '@/data/rate-limit';
export async function requestSupport(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({subject:z.string().trim().min(3).max(150),message:z.string().trim().min(10).max(3000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Escribe el asunto y cuéntanos qué ocurrió (al menos 10 caracteres).'};
 const c=await getContext(false);try{await rateLimit(c.db,'support');}catch{return {error:'Espera un momento e inténtalo de nuevo.'};}
 const {error}=await c.db.from('support_requests').insert({...parsed.data,user_id:c.user.id});
 if(error)return {error:'No pudimos registrar tu solicitud. Inténtalo de nuevo.'};
 return {message:'Tu solicitud quedó registrada. Podrás consultar su estado en Soporte.'};
}
