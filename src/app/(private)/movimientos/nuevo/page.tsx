import {randomUUID} from 'node:crypto';
import {getContext,getCategories} from '@/data/finance';
import {TransactionForm} from '@/components/transaction-form';
export default async function NewTransaction(){const c=await getContext();const categories=await getCategories(c);const date=new Intl.DateTimeFormat('en-CA',{timeZone:c.profile.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return <><header className="page-heading"><h1>Registrar movimiento</h1><p>Un pequeño paso hacia más claridad.</p></header><TransactionForm categories={categories} currency={c.profile.currency} defaults={{id:randomUUID(),description:'',merchant:'',categoryId:categories[0]?.id??'',occurredAt:date,amount:'',kind:'EXPENSE'}}/></>;}
