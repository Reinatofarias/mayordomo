'use client';
import {useActionState,useId} from 'react';
import {createPlanItem} from '@/app/(private)/plan/actions';
import {languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const copy={
 es:{name:'Nombre',budgetAmount:'Límite mensual',goalAmount:'Meta de ahorro',debtAmount:'Saldo de la deuda',goalCurrent:'Ya ahorrado',debtCurrent:'Pago mensual',budgetDate:'Mes',goalDate:'Fecha objetivo (opcional)',debtDate:'Próximo vencimiento (opcional)',interest:'Tasa anual de interés (%) · opcional',hint:'Usa un punto para los decimales. Las decisiones sobre tu plan te pertenecen.',saving:'Guardando…',saveBudget:'Guardar presupuesto',save:'Guardar'},
 pt:{name:'Nome',budgetAmount:'Limite mensal',goalAmount:'Meta de economia',debtAmount:'Saldo da dívida',goalCurrent:'Já economizado',debtCurrent:'Pagamento mensal',budgetDate:'Mês',goalDate:'Data objetivo (opcional)',debtDate:'Próximo vencimento (opcional)',interest:'Taxa anual de juros (%) · opcional',hint:'Use ponto para decimais. As decisões sobre seu plano pertencem a você.',saving:'Salvando…',saveBudget:'Salvar orçamento',save:'Salvar'}
};

export function PlanForm({kind,currency,month,initial,locale='es-MX'}:{initial?:{id:string;name:string;amount:string;current:string;date:string;interest:string};kind:'budget'|'goal'|'debt';currency:string;month:string;locale?:string}){
 const prefix=useId();const t=copy[languageFromLocale(locale)];
 const [state,action,pending]=useActionState(createPlanItem,{});
 return <form action={action} className="form-stack narrow"><input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={initial?.id??''}/>
 {kind!=='budget'?<div><Label htmlFor={prefix+'name'}>{t.name}</Label><Input id={prefix+'name'} name="name" defaultValue={initial?.name} required maxLength={100}/></div>:<input name="name" type="hidden" value=""/>}
 <div><Label htmlFor={prefix+'amount'}>{kind==='budget'?t.budgetAmount:kind==='goal'?t.goalAmount:t.debtAmount} · {currency}</Label><Input id={prefix+'amount'} name="amount" defaultValue={initial?.amount} inputMode="decimal" required/></div>
 {kind!=='budget'?<div><Label htmlFor={prefix+'current'}>{kind==='goal'?t.goalCurrent:t.debtCurrent} · {currency}</Label><Input id={prefix+'current'} name="current" inputMode="decimal" defaultValue={initial?.current??'0'} required/></div>:<input type="hidden" name="current" value="0"/>}
 <div><Label htmlFor={prefix+'date'}>{kind==='budget'?t.budgetDate:kind==='goal'?t.goalDate:t.debtDate}</Label><Input id={prefix+'date'} name="date" type={kind==='budget'?'month':'date'} defaultValue={initial?.date??(kind==='budget'?month:undefined)} required={kind==='budget'}/></div>
 {kind==='debt'?<div><Label htmlFor={prefix+'interest'}>{t.interest}</Label><Input id={prefix+'interest'} name="interest" defaultValue={initial?.interest} inputMode="decimal"/></div>:<input type="hidden" name="interest" value=""/>}
 <p className="hint">{t.hint}</p>
 {state.error&&<p className="error-message" role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}
 <Button disabled={pending}>{pending?t.saving:kind==='budget'?t.saveBudget:t.save}</Button>
 </form>;
}