import 'server-only';
import {z} from 'zod';
import type {getContext} from './finance';
type Context=Awaited<ReturnType<typeof getContext>>;
const base={id:z.uuid(),currency:z.string()};
export async function getPlan(c:Context){
 const results=await Promise.all([
 c.db.from('budgets').select('id,month,amount_minor::text,currency').eq('user_id',c.user.id).order('month',{ascending:false}),
 c.db.from('goals').select('id,name,target_amount_minor::text,current_amount_minor::text,currency,target_date').eq('user_id',c.user.id).order('created_at'),
 c.db.from('debts').select('id,name,balance_minor::text,monthly_payment_minor::text,currency,interest_rate_basis_points,due_date').eq('user_id',c.user.id).order('created_at'),
 c.db.from('budget_categories').select('id,budget_id,category_id,amount_minor::text').eq('user_id',c.user.id)
 ]);
 if(results.some(r=>r.error))throw new Error('No pudimos cargar tu plan.');
 return {
 budgets:z.array(z.object({...base,month:z.string(),amount_minor:z.string()})).parse(results[0].data),
 goals:z.array(z.object({...base,name:z.string(),target_amount_minor:z.string(),current_amount_minor:z.string(),target_date:z.string().nullable()})).parse(results[1].data),
 debts:z.array(z.object({...base,name:z.string(),balance_minor:z.string(),monthly_payment_minor:z.string(),interest_rate_basis_points:z.number().nullable(),due_date:z.string().nullable()})).parse(results[2].data),
 budgetCategories:z.array(z.object({id:z.uuid(),budget_id:z.uuid(),category_id:z.uuid(),amount_minor:z.string()})).parse(results[3].data)
 };
}
