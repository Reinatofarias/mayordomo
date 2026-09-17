'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { requireUser } from '@/data/supabase';
import { requireProductAccess } from '@/data/access';
import { parseMoney } from '@/domain/money';
import { initialSnapshot } from '@/domain/finance';
import { countries,countryFromLocale,objectives,normalizeLocale } from '@/i18n/es';
import type { FormState } from '@/app/auth-actions';
const currencySet=new Set(Intl.supportedValuesOf('currency'));
const schema=z.object({name:z.string().trim().min(1).max(80),country:z.string().length(2),currency:z.string().length(3),locale:z.string().trim().min(2).max(35),timezone:z.string().trim().min(3).max(80),income:z.string().max(24),fixed:z.string().max(24),debt:z.string().max(24),reserve:z.string().max(24),objective:z.enum(objectives),start:z.enum(['manual','import'])});
export async function completeOnboarding(_state:FormState,form:FormData):Promise<FormState>{
 const parsed=schema.safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Revisa los campos antes de continuar.'};
 const {db}=await requireUser();await requireProductAccess(db);const d=parsed.data;
 const locale=normalizeLocale(d.locale);const country=countries.find(c=>c.code===d.country)??countryFromLocale(locale);
 if(!currencySet.has(d.currency))return {error:'Selecciona una moneda valida.'};
 try{new Intl.DateTimeFormat(locale,{timeZone:d.timezone}).format(new Date());}catch{return {error:'La zona horaria no parece valida.'};}
 if(form.get('consent')!=='on')return {error:'Confirma los terminos y la privacidad para continuar.'};
 let snapshot;let amounts;
 try{
  amounts=[d.income,d.fixed,d.debt,d.reserve].map(s=>parseMoney(s,d.currency).amountMinor);
  if(amounts.some(a=>a<0n))return {error:'Usa importes iguales o mayores que cero.'};
  snapshot=initialSnapshot(amounts[0],amounts[1],amounts[2],amounts[3],d.currency);
 }catch{return {error:'Revisa los importes y los decimales de tu moneda.'};}
 const {error}=await db.rpc('complete_onboarding',{profile_data:{name:d.name,country:country.code,currency:d.currency,locale,timezone:d.timezone,monthly_income_minor:amounts[0].toString(),fixed_expenses_minor:amounts[1].toString(),opening_debt_minor:amounts[2].toString(),reserve_minor:amounts[3].toString(),objective:d.objective},snapshot_data:snapshot});
 if(error)return {error:'No pudimos guardar tu mapa. Intentalo de nuevo.'};
 redirect('/bienvenida/mapa?inicio='+d.start);
}