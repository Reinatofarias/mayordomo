import {z} from 'zod';
import {notFound} from 'next/navigation';
import {getContext,getCategories} from '@/data/finance';
import {decimalString,money} from '@/domain/money';
import {TransactionForm,DeleteTransaction} from '@/components/transaction-form';
export default async function EditTransaction({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const c=await getContext();
 const [{data,error},categories]=await Promise.all([c.db.from('transactions').select('id,description,merchant,category_id,occurred_at,amount_minor::text,currency,kind').eq('user_id',c.user.id).eq('id',id).single(),getCategories(c)]);
 if(error||!data)notFound();
 const t=z.object({id:z.uuid(),description:z.string(),merchant:z.string(),category_id:z.uuid(),occurred_at:z.string(),amount_minor:z.string(),currency:z.string(),kind:z.enum(['INCOME','EXPENSE'])}).parse(data);
 return <><header className="page-heading"><p className="eyebrow">AJUSTAR CON CLARIDAD</p><h1>Editar movimiento</h1><p>Corrige este registro para que tu lectura sea más fiel.</p></header><TransactionForm editing categories={categories} currency={t.currency} defaults={{id:t.id,description:t.description,merchant:t.merchant,categoryId:t.category_id,occurredAt:t.occurred_at,amount:decimalString(money(BigInt(t.amount_minor),t.currency)),kind:t.kind}}/><DeleteTransaction id={id}/></>;
}
