'use client';
import {useActionState} from 'react';import {saveCategoryBudget} from '@/app/(private)/plan/actions';import {Button} from '@/components/ui/button';import {Input} from '@/components/ui/input';
export function CategoryBudgetForm({budgetId,categories,currency}:{budgetId:string;categories:{id:string;name:string}[];currency:string}){
 const[state,action,pending]=useActionState(saveCategoryBudget,{});
 return <form action={action} className="form-stack narrow"><input type="hidden" name="budgetId" value={budgetId}/><div><label htmlFor="budget-category">Categoría</label><select id="budget-category" name="categoryId">{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label htmlFor="category-amount">Límite mensual · {currency}</label><Input id="category-amount" name="amount" inputMode="decimal" required maxLength={24}/></div>{state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}<Button disabled={pending}>Guardar límite por categoría</Button></form>;
}

