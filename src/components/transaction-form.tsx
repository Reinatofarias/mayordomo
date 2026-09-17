'use client';
import {useActionState,useMemo,useState} from 'react';
import {saveTransaction,deleteTransaction} from '@/app/(private)/movimientos/actions';
import {common,languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export type TransactionDefaults={id:string;description:string;merchant:string;categoryId:string;occurredAt:string;amount:string;kind:'INCOME'|'EXPENSE'};

const presetCopy={
 es:[
  {label:'Comida',category:'Alimentación',description:'Comida',kind:'EXPENSE' as const},
  {label:'Supermercado',category:'Supermercado',description:'Supermercado',kind:'EXPENSE' as const},
  {label:'Transporte',category:'Transporte',description:'Transporte',kind:'EXPENSE' as const},
  {label:'Servicios',category:'Servicios',description:'Servicio',kind:'EXPENSE' as const},
  {label:'Donación',category:'Donaciones',description:'Donación',kind:'EXPENSE' as const},
  {label:'Ingreso',category:'Ingresos',description:'Ingreso',kind:'INCOME' as const}
 ],
 pt:[
  {label:'Comida',category:'Alimentación',description:'Comida',kind:'EXPENSE' as const},
  {label:'Supermercado',category:'Supermercado',description:'Supermercado',kind:'EXPENSE' as const},
  {label:'Transporte',category:'Transporte',description:'Transporte',kind:'EXPENSE' as const},
  {label:'Serviços',category:'Servicios',description:'Serviço',kind:'EXPENSE' as const},
  {label:'Doação',category:'Donaciones',description:'Doação',kind:'EXPENSE' as const},
  {label:'Receita',category:'Ingresos',description:'Receita',kind:'INCOME' as const}
 ]
};

const copy={
 es:{shortcuts:'ATAJOS RÁPIDOS',kind:'Tipo',expense:'Gasto',income:'Ingreso',amount:'Importe',amountHint:'Usa un punto para los decimales, sin separadores de miles.',description:'Descripción',descriptionPlaceholder:'Ej. Comida, renta, salario',merchant:'Comercio o pagador',category:'Categoría',date:'Fecha',hint:'Registrar un movimiento es practicar fidelidad en lo pequeño. No necesitas perfección; necesitas claridad.',save:'Guardar movimiento',saving:'Guardando…',deleteConfirm:'Confirmo que quiero eliminar este movimiento.',delete:'Eliminar movimiento'},
 pt:{shortcuts:'ATALHOS RÁPIDOS',kind:'Tipo',expense:'Gasto',income:'Receita',amount:'Valor',amountHint:'Use ponto para decimais, sem separadores de milhar.',description:'Descrição',descriptionPlaceholder:'Ex. Comida, aluguel, salário',merchant:'Comércio ou pagador',category:'Categoria',date:'Data',hint:'Registrar um movimento é praticar fidelidade no pequeno. Você não precisa de perfeição; precisa de clareza.',save:'Salvar movimento',saving:'Salvando…',deleteConfirm:'Confirmo que quero excluir este movimento.',delete:'Excluir movimento'}
};

export function TransactionForm({categories,currency,defaults,editing=false,locale='es-MX'}:{categories:{id:string;name:string}[];currency:string;defaults:TransactionDefaults;editing?:boolean;locale?:string}){
 const lang=languageFromLocale(locale);const t=copy[lang];const presets=presetCopy[lang];const c=common(locale);
 const [state,action,pending]=useActionState(saveTransaction,{}),[kind,setKind]=useState(defaults.kind),[description,setDescription]=useState(defaults.description),[categoryId,setCategoryId]=useState(defaults.categoryId);
 const categoryByName=useMemo(()=>new Map(categories.map(category=>[category.name,category.id])),[categories]);
 function applyPreset(preset:(typeof presets)[number]){setKind(preset.kind);setDescription(preset.description);setCategoryId(categoryByName.get(preset.category)??defaults.categoryId);}
 return <form action={action} className="form-stack narrow transaction-quick-form"><input type="hidden" name="id" value={defaults.id}/><input type="hidden" name="editing" value={String(editing)}/>
 {!editing&&<div><p className="eyebrow">{t.shortcuts}</p><div className="quick-presets">{presets.map(preset=><button key={preset.label} type="button" onClick={()=>applyPreset(preset)}>{preset.label}</button>)}</div></div>}
 <div><Label htmlFor="kind">{t.kind}</Label><select id="kind" name="kind" value={kind} onChange={event=>setKind(event.target.value as 'INCOME'|'EXPENSE')}><option value="EXPENSE">{t.expense}</option><option value="INCOME">{t.income}</option></select></div>
 <div><Label htmlFor="amount">{t.amount} · {currency}</Label><Input id="amount" name="amount" inputMode="decimal" required defaultValue={defaults.amount} maxLength={24}/><p className="hint">{t.amountHint}</p></div>
 <div><Label htmlFor="description">{t.description}</Label><Input id="description" name="description" required maxLength={250} value={description} onChange={event=>setDescription(event.target.value)} placeholder={t.descriptionPlaceholder}/></div>
 <div><Label htmlFor="merchant">{t.merchant}</Label><Input id="merchant" name="merchant" maxLength={120} defaultValue={defaults.merchant} placeholder={c.optional}/></div>
 <div><Label htmlFor="categoryId">{t.category}</Label><select id="categoryId" name="categoryId" value={categoryId} onChange={event=>setCategoryId(event.target.value)}>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
 <div><Label htmlFor="occurredAt">{t.date}</Label><Input type="date" id="occurredAt" name="occurredAt" required defaultValue={defaults.occurredAt}/></div>
 <p className="hint">{t.hint}</p>
 {state.error&&<p role="alert" className="error-message">{state.error}</p>}<Button disabled={pending} type="submit">{pending?t.saving:t.save}</Button></form>;
}

export function DeleteTransaction({id,locale='es-MX'}:{id:string;locale?:string}){const [state,action,pending]=useActionState(deleteTransaction,{});const t=copy[languageFromLocale(locale)];return <form action={action} className="form-stack section narrow"><input type="hidden" name="id" value={id}/><label className="consent"><input type="checkbox" name="confirmed" required/>{t.deleteConfirm}</label>{state.error&&<p role="alert">{state.error}</p>}<Button variant="destructive" disabled={pending}>{t.delete}</Button></form>;}