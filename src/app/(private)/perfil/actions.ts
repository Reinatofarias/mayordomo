'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';
import type {FormState} from '@/app/auth-actions';
import {rateLimit} from '@/data/rate-limit';

export async function requestSupport(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({subject:z.string().trim().min(3).max(150),message:z.string().trim().min(10).max(3000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Escribe el asunto y cuéntanos qué ocurrió (al menos 10 caracteres).'};
 const c=await getContext(false);try{await rateLimit(c.db,'support');}catch{return {error:'Espera un momento e inténtalo de nuevo.'};}
 const {error}=await c.db.from('support_requests').insert({...parsed.data,user_id:c.user.id});
 if(error)return {error:'No pudimos registrar tu solicitud. Inténtalo de nuevo.'};
 revalidatePath('/perfil');
 return {message:'Tu solicitud quedó registrada. Podrás consultar su estado en Soporte.'};
}

export async function updateProfile(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({name:z.string().trim().min(1).max(80),phone:z.string().trim().max(40).optional(),locale:z.enum(['es-MX','es-CO','es-CL','es-PE','es-AR','es-EC','es-US','pt-BR']),timezone:z.string().trim().min(3).max(80)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Revisa tu nombre, teléfono, idioma y zona horaria.'};
 try{new Intl.DateTimeFormat('es-MX',{timeZone:parsed.data.timezone}).format(new Date());}catch{return {error:'La zona horaria no parece válida. Ejemplo: America/Mexico_City.'};}
 const c=await getContext(false);
 const {error}=await c.db.from('profiles').update({name:parsed.data.name,phone:parsed.data.phone??'',locale:parsed.data.locale,timezone:parsed.data.timezone}).eq('id',c.user.id);
 if(error)return {error:'No pudimos actualizar tu perfil. Inténtalo de nuevo.'};
 revalidatePath('/perfil');
 return {message:'Perfil actualizado. MAYORDOMO usará estos datos para personalizar tu experiencia.'};
}
