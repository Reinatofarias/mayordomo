'use client';
import {useActionState} from 'react';
import {saveTransaction,deleteTransaction} from '@/app/(private)/movimientos/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export type TransactionDefaults={id:string;description:string;merchant:string;categoryId:string;occurredAt:string;amount:string;kind:'INCOME'|'EXPENSE'};
export function TransactionForm({categories,currency,defaults,editing=false}:{categories:{id:string;name:string}[];currency:string;defaults:TransactionDefaults;editing?:boolean}){
 const [state,action,pending]=useActionState(saveTransaction,{});
 return <form action={action} className="form-stack narrow"><input type="hidden" name="id" value={defaults.id}/><input type="hidden" name="editing" value={String(editing)}/>
 <div><Label htmlFor="kind">Tipo</Label><select id="kind" name="kind" defaultValue={defaults.kind}><option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option></select></div>
 <div><Label htmlFor="amount">Importe · {currency}</Label><Input id="amount" name="amount" inputMode="decimal" required defaultValue={defaults.amount} maxLength={24}/><p className="hint">Usa un punto para los decimales, sin separadores de miles.</p></div>
 <div><Label htmlFor="description">Descripción</Label><Input id="description" name="description" required maxLength={250} defaultValue={defaults.description}/></div>
 <div><Label htmlFor="merchant">Comercio o pagador</Label><Input id="merchant" name="merchant" maxLength={120} defaultValue={defaults.merchant}/></div>
 <div><Label htmlFor="categoryId">Categoría</Label><select id="categoryId" name="categoryId" defaultValue={defaults.categoryId}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 <div><Label htmlFor="occurredAt">Fecha</Label><Input type="date" id="occurredAt" name="occurredAt" required defaultValue={defaults.occurredAt}/></div>
 {state.error&&<p role="alert" className="error-message">{state.error}</p>}<Button disabled={pending} type="submit">{pending?'Guardando…':'Guardar movimiento'}</Button></form>;
}
export function DeleteTransaction({id}:{id:string}){const [state,action,pending]=useActionState(deleteTransaction,{});return <form action={action} className="form-stack section narrow"><input type="hidden" name="id" value={id}/><label className="consent"><input type="checkbox" name="confirmed" required/>Confirmo que quiero eliminar este movimiento.</label>{state.error&&<p role="alert">{state.error}</p>}<Button variant="destructive" disabled={pending}>Eliminar movimiento</Button></form>;}
