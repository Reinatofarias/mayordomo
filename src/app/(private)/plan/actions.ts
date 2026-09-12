'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';
import {parseMoney} from '@/domain/money';
import type {FormState} from '@/app/auth-actions';
const base=z.object({id:z.union([z.uuid(),z.literal('')]).optional(),kind:z.enum(['budget','goal','debt']),name:z.string().trim().max(100),amount:z.string().max(24),current:z.string().max(24),date:z.string(),interest:z.string().max(12)});
export async function createPlanItem(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=base.safeParse(Object.fromEntries(form));if(!parsed.success)return {error:'Revisa los campos.'};
 const c=await getContext();const d=parsed.data;
 if(d.id&&d.kind==='budget')return {error:'Actualiza el presupuesto por mes.'};
 let currency=c.profile.currency;
 if(d.id){const existing=await c.db.from(d.kind==='goal'?'goals':'debts').select('currency').eq('id',d.id).eq('user_id',c.user.id).single();if(existing.error)return {error:'No encontramos este registro.'};currency=existing.data.currency;}
 let amount,current;try{amount=parseMoney(d.amount,currency).amountMinor;current=parseMoney(d.current||'0',currency).amountMinor;if(amount<0n||(d.kind!=='debt'&&amount===0n)||current<0n)throw new Error();}catch{return {error:'Revisa los importes.'};}
 let result;
 if(d.kind==='budget'){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.date))return {error:'Selecciona un mes válido.'};
  result=await c.db.from('budgets').upsert({user_id:c.user.id,month:d.date+'-01',amount_minor:amount.toString(),currency:c.profile.currency},{onConflict:'user_id,month,currency'});
 }else{
  if(!d.name)return {error:'Escribe un nombre.'};if(d.date&&!z.iso.date().safeParse(d.date).success)return {error:'Revisa la fecha.'};
  if(d.kind==='goal'){
   const values={name:d.name,target_amount_minor:amount.toString(),current_amount_minor:current.toString(),currency,target_date:d.date||null};
   result=d.id?await c.db.from('goals').update(values).eq('id',d.id).eq('user_id',c.user.id).select('id').single():await c.db.from('goals').insert({...values,user_id:c.user.id});
  }
  else{
   let interest:number|null=null;
   if(d.interest){if(!/^\d{1,4}(\.\d{1,2})?$/.test(d.interest))return {error:'Revisa la tasa de interés anual.'};interest=Number(parseMoney(d.interest,'USD').amountMinor);}
   const values={name:d.name,balance_minor:amount.toString(),monthly_payment_minor:current.toString(),currency,due_date:d.date||null,interest_rate_basis_points:interest};
   result=d.id?await c.db.from('debts').update(values).eq('id',d.id).eq('user_id',c.user.id).select('id').single():await c.db.from('debts').insert({...values,user_id:c.user.id});
  }
 }
 if(result.error)return {error:'No pudimos guardar los cambios. Inténtalo de nuevo.'};
 revalidatePath('/plan');return {message:'Guardado. Tu plan está actualizado.'};
}

export async function saveCategoryBudget(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=z.object({budgetId:z.uuid(),categoryId:z.uuid(),amount:z.string().max(24)}).safeParse(Object.fromEntries(form));
 if(!parsed.success)return {error:'Revisa la categoría y el importe.'};
 const c=await getContext();let minor:bigint;
 try{minor=parseMoney(parsed.data.amount,c.profile.currency).amountMinor;if(minor<=0n)throw new Error();}catch{return {error:'Usa un importe mayor que cero.'};}
 const parent=await c.db.from('budgets').select('id').eq('id',parsed.data.budgetId).eq('user_id',c.user.id).eq('currency',c.profile.currency).single();
 if(parent.error)return {error:'No encontramos ese presupuesto.'};
 const {error}=await c.db.from('budget_categories').upsert({user_id:c.user.id,budget_id:parsed.data.budgetId,category_id:parsed.data.categoryId,amount_minor:minor.toString()},{onConflict:'budget_id,category_id'});
 if(error)return {error:'No pudimos guardar el límite.'};
 revalidatePath('/plan');return {message:'Límite actualizado.'};
}
