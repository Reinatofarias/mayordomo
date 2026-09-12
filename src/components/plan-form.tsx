'use client';
import {useActionState,useId} from 'react';
import {createPlanItem} from '@/app/(private)/plan/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export function PlanForm({kind,currency,month,initial}:{initial?:{id:string;name:string;amount:string;current:string;date:string;interest:string};kind:'budget'|'goal'|'debt';currency:string;month:string}){
 const prefix=useId();
 const [state,action,pending]=useActionState(createPlanItem,{});
 return <form action={action} className="form-stack narrow"><input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={initial?.id??''}/>
 {kind!=='budget'?<div><Label htmlFor={prefix+'name'}>Nombre</Label><Input id={prefix+'name'} name="name" defaultValue={initial?.name} required maxLength={100}/></div>:<input name="name" type="hidden" value=""/>}
 <div><Label htmlFor={prefix+'amount'}>{kind==='budget'?'Límite mensual':kind==='goal'?'Meta de ahorro':'Saldo de la deuda'} · {currency}</Label><Input id={prefix+'amount'} name="amount" defaultValue={initial?.amount} inputMode="decimal" required/></div>
 {kind!=='budget'?<div><Label htmlFor={prefix+'current'}>{kind==='goal'?'Ya ahorrado':'Pago mensual'} · {currency}</Label><Input id={prefix+'current'} name="current" inputMode="decimal" defaultValue={initial?.current??'0'} required/></div>:<input type="hidden" name="current" value="0"/>}
 <div><Label htmlFor={prefix+'date'}>{kind==='budget'?'Mes':kind==='goal'?'Fecha objetivo (opcional)':'Próximo vencimiento (opcional)'}</Label><Input id={prefix+'date'} name="date" type={kind==='budget'?'month':'date'} defaultValue={initial?.date??(kind==='budget'?month:undefined)} required={kind==='budget'}/></div>
 {kind==='debt'?<div><Label htmlFor={prefix+'interest'}>Tasa anual de interés (%) · opcional</Label><Input id={prefix+'interest'} name="interest" defaultValue={initial?.interest} inputMode="decimal"/></div>:<input type="hidden" name="interest" value=""/>}
 <p className="hint">Usa un punto para los decimales. Las decisiones sobre tu plan te pertenecen.</p>
 {state.error&&<p className="error-message" role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}
 <Button disabled={pending}>{pending?'Guardando…':kind==='budget'?'Guardar presupuesto':'Guardar'}</Button>
 </form>;
}
