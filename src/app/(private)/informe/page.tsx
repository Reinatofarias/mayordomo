import {getContext,getTransactions,getCategories,localMonth} from '@/data/finance';
import {getPlan} from '@/data/plan';
import {totals,byCategory,anomalies,budgetStatus} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
export default async function Report({searchParams}:{searchParams:Promise<{mes?:string}>}){
 const c=await getContext();const {mes}=await searchParams;const month=mes&&/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)?mes:localMonth(c.profile.timezone);
 const [year,m]=month.split('-').map(Number);const previous=new Date(Date.UTC(year,m-2,1)).toISOString().slice(0,7);
 const [rows,previousRows,categories,plan,principles]=await Promise.all([getTransactions(c,month),getTransactions(c,previous),getCategories(c),getPlan(c),c.db.from('biblical_principles').select('reference,principle,application').eq('theme','mayordomía').eq('active',true).single()]);
 const current=totals(rows,c.profile.currency),before=totals(previousRows,c.profile.currency);
 const format=(minor:string)=>displayMoney(minor,c.profile.currency,c.profile.locale);
 const debt=plan.debts.filter(d=>d.currency===c.profile.currency).reduce((sum,d)=>sum+BigInt(d.balance_minor),0n);
 const spending=Object.entries(byCategory(rows,c.profile.currency)).sort((a,b)=>BigInt(a[1])>BigInt(b[1])?-1:1);
 const budget=plan.budgets.find(b=>b.month.startsWith(month)&&b.currency===c.profile.currency);
 const changes=anomalies(rows,previousRows,c.profile.currency);
 await c.db.rpc('record_activity',{event_type:'REPORT_VIEWED'});
 return <><header className="page-heading"><p className="eyebrow">UNA PAUSA PARA MIRAR EL CAMINO</p><h1>Informe de Mayordomía</h1><p>Lo que registraste, lo que aprendiste y tu próximo paso.</p></header>
 <form className="filters"><div><label htmlFor="mes">Período</label><input type="month" name="mes" id="mes" defaultValue={month}/></div><Button variant="outline">Ver informe</Button></form>
 <p className="hint">Solo incluye movimientos registrados en {c.profile.currency}. {month===localMonth(c.profile.timezone)?'El mes actual está incompleto; la comparación con el mes anterior es provisional.':''}</p>
 <dl className="metric-grid"><div><dt>Ingresos</dt><dd>{format(current.income.amountMinor)}</dd></div><div><dt>Gastos</dt><dd>{format(current.expenses.amountMinor)}</dd></div><div><dt>Excedente registrado</dt><dd>{format(current.net.amountMinor)}</dd></div><div><dt>Saldo actual de deudas registradas</dt><dd>{format(debt.toString())}</dd></div><div><dt>Cambio en gastos frente al mes anterior</dt><dd>{previousRows.length?format((BigInt(current.expenses.amountMinor)-BigInt(before.expenses.amountMinor)).toString()):'Sin datos previos'}</dd></div><div><dt>Presupuesto del período</dt><dd>{budget?format(budget.amount_minor):'Sin presupuesto'}</dd></div></dl>
 <p className="hint">El excedente no confirma dinero ahorrado. Las deudas muestran el saldo actual, no un saldo histórico del mes seleccionado.</p>
 <section className="section"><h2>Principales categorías</h2>{spending.length?<ul className="transaction-list">{spending.map(([id,value])=><li key={id}><span>{categories.find(cat=>cat.id===id)?.name??'Otros'}</span><span>{format(value)}</span></li>)}</ul>:<p>Aún no hay gastos registrados en este período.</p>}</section>
 <section className="section"><h2>Lo que merece atención</h2><p>{budget?budgetStatus(BigInt(current.expenses.amountMinor),BigInt(budget.amount_minor)).status:'Define un presupuesto para comparar tus gastos con tu plan.'}</p><p>{changes.length?changes.length+' categorías superan en más de 30 % los gastos registrados del mes anterior.':'Continúa registrando para reconocer cambios con más claridad.'}</p></section>
 <section className="section"><h2>Tres acciones para el próximo mes</h2><ol className="action-list"><li>Revisa si faltan movimientos o hay duplicados.</li><li>Ajusta un límite de gasto según tus necesidades reales.</li><li>Elige un paso pequeño hacia tu objetivo: {c.profile.objective}.</li></ol></section>
 {principles.data&&<blockquote><p>{principles.data.principle}</p><cite>{principles.data.reference} · Paráfrasis</cite><p className="hint">{principles.data.application}</p></blockquote>}</>;
}

