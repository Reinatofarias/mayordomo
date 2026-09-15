import Link from 'next/link';
import {decimalString,money} from '@/domain/money';
import {getContext,localMonth,getTransactions,getCategories} from '@/data/finance';
import {getPlan} from '@/data/plan';
import {totals,budgetStatus,progressValue,byCategory} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {PlanForm} from '@/components/plan-form';
import {CategoryBudgetForm} from '@/components/category-budget-form';
import {PrincipleCard} from '@/components/principle-card';

type View='presupuesto'|'metas'|'deudas'|'ahorro';
const viewMeta:Record<View,{label:string;theme:string;title:string;description:string;action:string}>={
 presupuesto:{label:'Presupuesto',theme:'planificación',title:'Construye un límite antes de que el mes decida por ti.',description:'Un presupuesto no controla tu vida; te ayuda a administrar con intención lo que Dios puso en tus manos.',action:'Define un límite mensual realista y luego reparte las categorías que más pesan.'},
 metas:{label:'Metas',theme:'sabiduría',title:'Convierte tus deseos en pasos visibles.',description:'Una meta clara ayuda a comparar recursos, tiempo y prioridades antes de comprometer dinero.',action:'Elige una meta pequeña y registra cuánto ya tienes separado.'},
 deudas:{label:'Deudas',theme:'deuda',title:'Mira tus deudas con verdad y esperanza.',description:'Registrar una deuda no es vergüenza; es el primer paso para recuperar margen y libertad de decisión.',action:'Empieza por el saldo y el pago mensual de una deuda concreta.'},
 ahorro:{label:'Ahorro',theme:'ahorro',title:'Tu reserva protege decisiones futuras.',description:'Ahorrar según tus posibilidades crea espacio para actuar con más paz ante imprevistos.',action:'Si todavía no tienes meta de reserva, crea una meta sencilla para comenzar.'}
};

function normalizeView(value:string|undefined):View{return value==='metas'||value==='deudas'||value==='ahorro'?value:'presupuesto';}

export default async function Plan({searchParams}:{searchParams:Promise<{vista?:string}>}){
 const c=await getContext(),month=localMonth(c.profile.timezone);const query=await searchParams;
 const view=normalizeView(query.vista),meta=viewMeta[view];
 const [plan,transactions,categories,principleResult]=await Promise.all([getPlan(c),getTransactions(c,month),getCategories(c),c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme',meta.theme).eq('active',true).single()]);const format=(value:string,currency:string)=>displayMoney(value,currency,c.profile.locale);
 const decimal=(value:string,currency:string)=>decimalString(money(BigInt(value),currency));
 const monthlyTotals=totals(transactions,c.profile.currency),spent=monthlyTotals.expenses.amountMinor;
 const currentBudget=plan.budgets.find(b=>b.month.startsWith(month)&&b.currency===c.profile.currency),categorySpending=byCategory(transactions,c.profile.currency);
 const totalDebt=plan.debts.filter(d=>d.currency===c.profile.currency).reduce((sum,d)=>sum+BigInt(d.balance_minor),0n);
 const activeGoals=plan.goals.filter(g=>g.currency===c.profile.currency).length;
 return <><header className="page-heading"><p className="eyebrow">DECISIONES CON INTENCIÓN</p><h1>Tu plan</h1><p>Pequeños pasos para lo que de verdad importa.</p></header><nav className="subnav" aria-label="Secciones del plan">{(Object.keys(viewMeta) as View[]).map(id=><Link key={id} aria-current={view===id?'page':undefined} href={'/plan?vista='+id}>{viewMeta[id].label}</Link>)}</nav>
 <section className="plan-guidance"><div><p className="eyebrow">GUÍA PARA ESTA DECISIÓN</p><h2>{meta.title}</h2><p>{meta.description}</p><strong>{meta.action}</strong></div>{principleResult.data&&<PrincipleCard reference={principleResult.data.reference} principle={principleResult.data.principle} application={principleResult.data.application} riskContext={principleResult.data.risk_context}/>}</section>
 <dl className="metric-grid plan-summary"><div><dt>Gastos registrados este mes</dt><dd>{format(spent,c.profile.currency)}</dd></div><div><dt>Presupuesto activo</dt><dd>{currentBudget?format(currentBudget.amount_minor,currentBudget.currency):'Sin presupuesto'}</dd></div><div><dt>Deudas registradas</dt><dd>{format(totalDebt.toString(),c.profile.currency)}</dd></div><div><dt>Metas activas</dt><dd>{activeGoals.toString()}</dd></div></dl>
 <div className="plan-list">{view==='presupuesto'&&plan.budgets.map(b=><article className="plan-item" key={b.id}><h3>{b.month.slice(0,7)} · {format(b.amount_minor,b.currency)}</h3>{b.month.startsWith(month)&&b.currency===c.profile.currency&&<p>{budgetStatus(BigInt(spent),BigInt(b.amount_minor)).status} · Gastado: {format(spent,b.currency)}</p>}</article>)}
 {(view==='metas'||view==='ahorro')&&plan.goals.map(g=><article className="plan-item" key={g.id}><h3>{g.name}</h3><p>{format(g.current_amount_minor,g.currency)} de {format(g.target_amount_minor,g.currency)}</p><progress aria-label={'Progreso de '+g.name} max={10000} value={progressValue(g.current_amount_minor,g.target_amount_minor)}/>{g.target_date&&<small>Objetivo: {g.target_date}</small>}<details><summary>Actualizar meta</summary><PlanForm kind="goal" currency={g.currency} month={month} initial={{id:g.id,name:g.name,amount:decimal(g.target_amount_minor,g.currency),current:decimal(g.current_amount_minor,g.currency),date:g.target_date??'',interest:''}}/></details></article>)}
 {view==='deudas'&&plan.debts.map(d=><article className="plan-item" key={d.id}><h3>{d.name}</h3><p>Saldo: {format(d.balance_minor,d.currency)}<br/>Pago mensual: {format(d.monthly_payment_minor,d.currency)}</p>{d.due_date&&<small>Vencimiento: {d.due_date}</small>}<details><summary>Actualizar saldo y condiciones</summary><p className="hint">Actualiza el saldo pendiente. Esto no crea un movimiento de pago.</p><PlanForm kind="debt" currency={d.currency} month={month} initial={{id:d.id,name:d.name,amount:decimal(d.balance_minor,d.currency),current:decimal(d.monthly_payment_minor,d.currency),date:d.due_date??'',interest:d.interest_rate_basis_points===null?'':decimal(String(d.interest_rate_basis_points),'USD')}}/></details></article>)}</div>
 <section className="section">{view==='ahorro'?<><h2>Tu reserva inicial</h2><p>{format(c.profile.reserve_minor,c.profile.currency)} · Estimación del onboarding.</p><p className="hint">Una reserva empieza pequeña y crece con constancia. No fuerces ahorro si faltan necesidades básicas.</p><Link href="/plan?vista=metas">Define una meta para tu reserva →</Link></>:<><h2>{view==='presupuesto'?'Define tu presupuesto':view==='metas'?'Crea una meta':'Registra una deuda'}</h2><PlanForm key={view} kind={view==='presupuesto'?'budget':view==='metas'?'goal':'debt'} currency={c.profile.currency} month={month}/></>}</section>
 {view==='presupuesto'&&currentBudget&&<section className="section"><h2>Límites por categoría · {month}</h2>{plan.budgetCategories.filter(b=>b.budget_id===currentBudget.id).map(b=><p key={b.id}>{categories.find(cat=>cat.id===b.category_id)?.name}: {format(categorySpending[b.category_id]??'0',c.profile.currency)} de {format(b.amount_minor,c.profile.currency)} · {budgetStatus(BigInt(categorySpending[b.category_id]??'0'),BigInt(b.amount_minor)).status}</p>)}<CategoryBudgetForm budgetId={currentBudget.id} categories={categories} currency={c.profile.currency}/></section>}</>;
}
