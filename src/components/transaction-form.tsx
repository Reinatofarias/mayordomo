'use client';
import {useActionState,useMemo,useState} from 'react';
import {saveTransaction,deleteTransaction} from '@/app/(private)/movimientos/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export type TransactionDefaults={id:string;description:string;merchant:string;categoryId:string;occurredAt:string;amount:string;kind:'INCOME'|'EXPENSE'};
const presets=[
 {label:'Comida',category:'Alimentación',description:'Comida',kind:'EXPENSE' as const},
 {label:'Supermercado',category:'Supermercado',description:'Supermercado',kind:'EXPENSE' as const},
 {label:'Transporte',category:'Transporte',description:'Transporte',kind:'EXPENSE' as const},
 {label:'Servicios',category:'Servicios',description:'Servicio',kind:'EXPENSE' as const},
 {label:'Donación',category:'Donaciones',description:'Donación',kind:'EXPENSE' as const},
 {label:'Ingreso',category:'Ingresos',description:'Ingreso',kind:'INCOME' as const}
];
export function TransactionForm({categories,currency,defaults,editing=false}:{categories:{id:string;name:string}[];currency:string;defaults:TransactionDefaults;editing?:boolean}){
 const [state,action,pending]=useActionState(saveTransaction,{}),[kind,setKind]=useState(defaults.kind),[description,setDescription]=useState(defaults.description),[categoryId,setCategoryId]=useState(defaults.categoryId);
 const categoryByName=useMemo(()=>new Map(categories.map(c=>[c.name,c.id])),[categories]);
 function applyPreset(preset:(typeof presets)[number]){setKind(preset.kind);setDescription(preset.description);setCategoryId(categoryByName.get(preset.category)??defaults.categoryId);}
 return <form action={action} className="form-stack narrow transaction-quick-form"><input type="hidden" name="id" value={defaults.id}/><input type="hidden" name="editing" value={String(editing)}/>
 {!editing&&<div><p className="eyebrow">ATAJOS RÁPIDOS</p><div className="quick-presets">{presets.map(p=><button key={p.label} type="button" onClick={()=>applyPreset(p)}>{p.label}</button>)}</div></div>}
 <div><Label htmlFor="kind">Tipo</Label><select id="kind" name="kind" value={kind} onChange={event=>setKind(event.target.value as 'INCOME'|'EXPENSE')}><option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option></select></div>
 <div><Label htmlFor="amount">Importe · {currency}</Label><Input id="amount" name="amount" inputMode="decimal" required defaultValue={defaults.amount} maxLength={24}/><p className="hint">Usa un punto para los decimales, sin separadores de miles.</p></div>
 <div><Label htmlFor="description">Descripción</Label><Input id="description" name="description" required maxLength={250} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Ej. Comida, renta, salario"/></div>
 <div><Label htmlFor="merchant">Comercio o pagador</Label><Input id="merchant" name="merchant" maxLength={120} defaultValue={defaults.merchant} placeholder="Opcional"/></div>
 <div><Label htmlFor="categoryId">Categoría</Label><select id="categoryId" name="categoryId" value={categoryId} onChange={event=>setCategoryId(event.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 <div><Label htmlFor="occurredAt">Fecha</Label><Input type="date" id="occurredAt" name="occurredAt" required defaultValue={defaults.occurredAt}/></div>
 <p className="hint">Registrar un movimiento es practicar fidelidad en lo pequeño. No necesitas perfección; necesitas claridad.</p>
 {state.error&&<p role="alert" className="error-message">{state.error}</p>}<Button disabled={pending} type="submit">{pending?'Guardando…':'Guardar movimiento'}</Button></form>;
}
export function DeleteTransaction({id}:{id:string}){const [state,action,pending]=useActionState(deleteTransaction,{});return <form action={action} className="form-stack section narrow"><input type="hidden" name="id" value={id}/><label className="consent"><input type="checkbox" name="confirmed" required/>Confirmo que quiero eliminar este movimiento.</label>{state.error&&<p role="alert">{state.error}</p>}<Button variant="destructive" disabled={pending}>Eliminar movimiento</Button></form>;}
