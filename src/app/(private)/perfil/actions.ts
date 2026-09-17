'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';
import type {FormState} from '@/app/auth-actions';
import {rateLimit} from '@/data/rate-limit';
import {countries,countryFromLocale,normalizeLocale} from '@/i18n/es';

const currencySet=new Set(Intl.supportedValuesOf('currency'));

export async function requestSupport(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({subject:z.string().trim().min(3).max(150),message:z.string().trim().min(10).max(3000)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Escribe el asunto y cuentanos que ocurrio (al menos 10 caracteres).'};
 const c=await getContext(false);try{await rateLimit(c.db,'support');}catch{return {error:'Espera un momento e intentalo de nuevo.'};}
 const {error}=await c.db.from('support_requests').insert({...parsed.data,user_id:c.user.id});
 if(error)return {error:'No pudimos registrar tu solicitud. Intentalo de nuevo.'};
 revalidatePath('/perfil');
 return {message:'Tu solicitud quedo registrada. Podras consultar su estado en Soporte.'};
}

export async function updateProfile(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({name:z.string().trim().min(1).max(80),phone:z.string().trim().max(40).optional(),country:z.string().length(2),currency:z.string().length(3),locale:z.string().trim().min(2).max(35),timezone:z.string().trim().min(3).max(80)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Revisa tu nombre, teléfono, país, moneda, idioma y zona horaria.'};
 const locale=normalizeLocale(parsed.data.locale);const country=countries.find(c=>c.code===parsed.data.country)??countryFromLocale(locale);
 if(!currencySet.has(parsed.data.currency))return {error:locale.startsWith('pt')?'Selecione uma moeda válida.':'Selecciona una moneda válida.'};
 try{new Intl.DateTimeFormat(locale,{timeZone:parsed.data.timezone}).format(new Date());}catch{return {error:locale.startsWith('pt')?'O fuso horário não parece válido. Exemplo: America/Sao_Paulo.':'La zona horaria no parece válida. Ejemplo: America/Mexico_City.'};}
 const c=await getContext(false);
 const {error}=await c.db.from('profiles').update({name:parsed.data.name,phone:parsed.data.phone??'',country:country.code,currency:parsed.data.currency,locale,timezone:parsed.data.timezone}).eq('id',c.user.id);
 if(error)return {error:locale.startsWith('pt')?'Não conseguimos atualizar seu perfil. Tente novamente.':'No pudimos actualizar tu perfil. Inténtalo de nuevo.'};
 revalidatePath('/','layout');revalidatePath('/perfil');revalidatePath('/hoy');revalidatePath('/movimientos');revalidatePath('/plan');revalidatePath('/informe');
 return {message:locale.startsWith('pt')?'Perfil atualizado. As próximas telas e novos registros usarão esta configuração.':'Perfil actualizado. Las próximas pantallas y nuevos registros usarán esta configuración.'};
}