import {z} from 'zod';
import {notFound} from 'next/navigation';
import {getContext,getCategories} from '@/data/finance';
import {decimalString,money} from '@/domain/money';
import {languageFromLocale} from '@/i18n/app';
import {TransactionForm,DeleteTransaction} from '@/components/transaction-form';

const copy={
 es:{eyebrow:'AJUSTAR CON CLARIDAD',title:'Editar movimiento',intro:'Corrige este registro para que tu lectura sea más fiel.'},
 pt:{eyebrow:'AJUSTAR COM CLAREZA',title:'Editar movimento',intro:'Corrija este registro para que sua leitura seja mais fiel.'}
};

export default async function EditTransaction({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const c=await getContext();const t=copy[languageFromLocale(c.profile.locale)];
 const [{data,error},categories]=await Promise.all([c.db.from('transactions').select('id,description,merchant,category_id,occurred_at,amount_minor::text,currency,kind').eq('user_id',c.user.id).eq('id',id).single(),getCategories(c)]);
 if(error||!data)notFound();
 const row=z.object({id:z.uuid(),description:z.string(),merchant:z.string(),category_id:z.uuid(),occurred_at:z.string(),amount_minor:z.string(),currency:z.string(),kind:z.enum(['INCOME','EXPENSE'])}).parse(data);
 return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header><TransactionForm editing categories={categories} currency={row.currency} locale={c.profile.locale} defaults={{id:row.id,description:row.description,merchant:row.merchant,categoryId:row.category_id,occurredAt:row.occurred_at,amount:decimalString(money(BigInt(row.amount_minor),row.currency)),kind:row.kind}}/><DeleteTransaction id={id} locale={c.profile.locale}/></>;
}