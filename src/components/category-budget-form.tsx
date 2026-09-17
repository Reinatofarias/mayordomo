'use client';
import {useActionState} from 'react';
import {saveCategoryBudget} from '@/app/(private)/plan/actions';
import {languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

const copy={
 es:{category:'Categoría',amount:'Límite mensual',save:'Guardar límite por categoría'},
 pt:{category:'Categoria',amount:'Limite mensal',save:'Salvar limite por categoria'}
};

export function CategoryBudgetForm({budgetId,categories,currency,locale='es-MX'}:{budgetId:string;categories:{id:string;name:string}[];currency:string;locale?:string}){
 const[state,action,pending]=useActionState(saveCategoryBudget,{});const t=copy[languageFromLocale(locale)];
 return <form action={action} className="form-stack narrow"><input type="hidden" name="budgetId" value={budgetId}/><div><label htmlFor="budget-category">{t.category}</label><select id="budget-category" name="categoryId">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label htmlFor="category-amount">{t.amount} · {currency}</label><Input id="category-amount" name="amount" inputMode="decimal" required maxLength={24}/></div>{state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}<Button disabled={pending}>{t.save}</Button></form>;
}