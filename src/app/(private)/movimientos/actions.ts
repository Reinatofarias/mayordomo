'use server';
import {z} from 'zod';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';
import {parseMoney} from '@/domain/money';
import type {FormState} from '@/app/auth-actions';
const schema=z.object({id:z.uuid(),description:z.string().trim().min(1).max(250),merchant:z.string().trim().max(120),categoryId:z.uuid(),occurredAt:z.iso.date(),amount:z.string().max(24),kind:z.enum(['INCOME','EXPENSE'])});
export async function saveTransaction(_previous:FormState,form:FormData):Promise<FormState>{
 const parsed=schema.safeParse(Object.fromEntries(form));if(!parsed.success)return {error:'Revisa la descripción, fecha, categoría e importe.'};
 const c=await getContext();const d=parsed.data;let amount;
 try{amount=parseMoney(d.amount,c.profile.currency).amountMinor;if(amount<=0n)throw new Error();}catch{return {error:'Escribe un importe mayor que cero con los decimales de tu moneda.'};}
 const record={description:d.description,merchant:d.merchant,category_id:d.categoryId,occurred_at:d.occurredAt,amount_minor:amount.toString(),currency:c.profile.currency,kind:d.kind};
 const result=form.get('editing')==='true'?await c.db.from('transactions').update(record).eq('id',d.id).eq('user_id',c.user.id).select('id').single():await c.db.from('transactions').insert({...record,id:d.id,user_id:c.user.id,source:'MANUAL',external_id:d.id}).select('id').single();
 if(result.error){if(result.error.code!=='23505')return {error:'No pudimos guardar el movimiento. Inténtalo de nuevo.'};}
 revalidatePath('/hoy');revalidatePath('/movimientos');redirect('/movimientos');
}
export async function deleteTransaction(_previous:FormState,form:FormData):Promise<FormState>{
 const id=z.uuid().safeParse(form.get('id'));if(!id.success||form.get('confirmed')!=='on')return {error:'Confirma que quieres eliminar este movimiento.'};
 const c=await getContext();const {error}=await c.db.from('transactions').delete().eq('id',id.data).eq('user_id',c.user.id);
 if(error)return {error:'No pudimos eliminar el movimiento.'};revalidatePath('/hoy');revalidatePath('/movimientos');redirect('/movimientos');
}
