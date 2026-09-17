import {randomUUID} from 'node:crypto';
import {getContext,getCategories} from '@/data/finance';
import {languageFromLocale} from '@/i18n/app';
import {TransactionForm} from '@/components/transaction-form';
import {PrincipleCard} from '@/components/principle-card';

const copy={
 es:{eyebrow:'FIDELIDAD EN LO PEQUEÑO',title:'Registrar movimiento',intro:'Un pequeño paso hacia más claridad.'},
 pt:{eyebrow:'FIDELIDADE NO PEQUENO',title:'Registrar movimento',intro:'Um pequeno passo rumo a mais clareza.'}
};

export default async function NewTransaction(){
 const c=await getContext();const t=copy[languageFromLocale(c.profile.locale)];
 const [categories,{data:principle}]=await Promise.all([getCategories(c),c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','responsabilidad').eq('active',true).single()]);
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:c.profile.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>{principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}<TransactionForm categories={categories} currency={c.profile.currency} locale={c.profile.locale} defaults={{id:randomUUID(),description:'',merchant:'',categoryId:categories[0]?.id??'',occurredAt:date,amount:'',kind:'EXPENSE'}}/></>;
}