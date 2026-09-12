import 'server-only';
import {z} from 'zod';
import {redirect} from 'next/navigation';
import {requireUser} from './supabase';
import {claimPendingProductAccess,hasProductAccess} from './access';
const minor=z.string().regex(/^-?\d+$/);
export const profileSchema=z.object({id:z.uuid(),name:z.string(),country:z.string(),currency:z.string(),locale:z.string(),timezone:z.string(),monthly_income_minor:minor,fixed_expenses_minor:minor,opening_debt_minor:minor,reserve_minor:minor,objective:z.string().nullable(),onboarding_completed_at:z.string().nullable()});
const profileFields='id,name,country,currency,locale,timezone,monthly_income_minor::text,fixed_expenses_minor::text,opening_debt_minor::text,reserve_minor::text,objective,onboarding_completed_at';
export async function getContext(requireAccess=true){
 const {db,user}=await requireUser();
 const {data,error}=await db.from('profiles').select(profileFields).eq('id',user.id).single();
 if(error)throw new Error('No pudimos cargar tu perfil.');
 const profile=profileSchema.parse(data);
 await claimPendingProductAccess(db);
 if(requireAccess&&!await hasProductAccess(db))redirect('/acceso/pendiente');
 if(!profile.onboarding_completed_at)redirect('/bienvenida');
 return {db,user,profile};
}
export function monthBounds(month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Mes no válido.');
 const [year,m]=month.split('-').map(Number);
 return {start:month+'-01',end:new Date(Date.UTC(year,m,1)).toISOString().slice(0,10)};
}
export function localMonth(timezone:string){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit'}).formatToParts(new Date());
 return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value;
}
const transactionSchema=z.object({id:z.uuid(),amount_minor:minor,currency:z.string(),kind:z.enum(['INCOME','EXPENSE']),occurred_at:z.string(),category_id:z.uuid(),merchant:z.string(),description:z.string(),source:z.string(),account_id:z.string().nullable()});
export async function getTransactions(context:Awaited<ReturnType<typeof getContext>>,month:string){
 const {start,end}=monthBounds(month);const rows:z.infer<typeof transactionSchema>[]=[];
 for(let offset=0;;offset+=500){
 const {data,error}=await context.db.from('transactions').select('id,amount_minor::text,currency,kind,occurred_at,category_id,merchant,description,source,account_id').eq('user_id',context.user.id).gte('occurred_at',start).lt('occurred_at',end).order('occurred_at',{ascending:false}).order('id').range(offset,offset+499);
 if(error)throw new Error('No pudimos cargar los movimientos.');
 const batch=z.array(transactionSchema).parse(data);rows.push(...batch);if(batch.length<500)break;
 }
 return rows.map(t=>({id:t.id,amountMinor:t.amount_minor,currency:t.currency,kind:t.kind,occurredAt:t.occurred_at,categoryId:t.category_id,merchant:t.merchant,description:t.description,source:t.source,accountId:t.account_id}));
}
export async function getCategories(context:Awaited<ReturnType<typeof getContext>>){
 const {data,error}=await context.db.from('categories').select('id,name').order('name');
 if(error)throw new Error('No pudimos cargar las categorías.');
 return z.array(z.object({id:z.uuid(),name:z.string()})).parse(data);
}
