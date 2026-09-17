import {getContext,getTransactions,getCategories,localMonth} from '@/data/finance';
import {getPlan} from '@/data/plan';
import {totals,byCategory,anomalies,budgetStatus} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {budgetStatusText,languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';

const copy={
 es:{eyebrow:'UNA PAUSA PARA MIRAR EL CAMINO',title:'Informe de Mayordomía',intro:'Lo que registraste, lo que aprendiste y tu próximo paso.',period:'Período',see:'Ver informe',hint:(currency:string,current:boolean)=>`Solo incluye movimientos registrados en ${currency}. ${current?'El mes actual está incompleto; la comparación con el mes anterior es provisional.':''}`,income:'Ingresos',expenses:'Gastos',net:'Excedente registrado',debt:'Saldo actual de deudas registradas',change:'Cambio en gastos frente al mes anterior',budget:'Presupuesto del período',noPrevious:'Sin datos previos',noBudget:'Sin presupuesto',note:'El excedente no confirma dinero ahorrado. Las deudas muestran el saldo actual, no un saldo histórico del mes seleccionado.',top:'Principales categorías',noRows:'Aún no hay gastos registrados en este período.',attention:'Lo que merece atención',budgetPrompt:'Define un presupuesto para comparar tus gastos con tu plan.',changes:(count:number)=>count?`${count} categorías superan en más de 30 % los gastos registrados del mes anterior.`:'Continúa registrando para reconocer cambios con más claridad.',actions:'Tres acciones para el próximo mes',a1:'Revisa si faltan movimientos o hay duplicados.',a2:'Ajusta un límite de gasto según tus necesidades reales.',a3:'Elige un paso pequeño hacia tu objetivo'},
 pt:{eyebrow:'UMA PAUSA PARA OLHAR O CAMINHO',title:'Relatório de Mordomia',intro:'O que você registrou, o que aprendeu e seu próximo passo.',period:'Período',see:'Ver relatório',hint:(currency:string,current:boolean)=>`Inclui somente movimentos registrados em ${currency}. ${current?'O mês atual está incompleto; a comparação com o mês anterior é provisória.':''}`,income:'Receitas',expenses:'Gastos',net:'Excedente registrado',debt:'Saldo atual das dívidas registradas',change:'Mudança nos gastos frente ao mês anterior',budget:'Orçamento do período',noPrevious:'Sem dados anteriores',noBudget:'Sem orçamento',note:'O excedente não confirma dinheiro economizado. As dívidas mostram o saldo atual, não um saldo histórico do mês selecionado.',top:'Principais categorias',noRows:'Ainda não há gastos registrados neste período.',attention:'O que merece atenção',budgetPrompt:'Defina um orçamento para comparar seus gastos com seu plano.',changes:(count:number)=>count?`${count} categorias superam em mais de 30% os gastos registrados do mês anterior.`:'Continue registrando para reconhecer mudanças com mais clareza.',actions:'Três ações para o próximo mês',a1:'Revise se faltam movimentos ou há duplicados.',a2:'Ajuste um limite de gasto conforme suas necessidades reais.',a3:'Escolha um passo pequeno rumo ao seu objetivo'}
};

export default async function Report({searchParams}:{searchParams:Promise<{mes?:string}>}){
 const c=await getContext();const {mes}=await searchParams;const month=mes&&/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)?mes:localMonth(c.profile.timezone);const t=copy[languageFromLocale(c.profile.locale)];
 const [year,m]=month.split('-').map(Number);const previous=new Date(Date.UTC(year,m-2,1)).toISOString().slice(0,7);
 const [rows,previousRows,categories,plan,principles]=await Promise.all([getTransactions(c,month),getTransactions(c,previous),getCategories(c),getPlan(c),c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','mayordomía').eq('active',true).single()]);
 const current=totals(rows,c.profile.currency),before=totals(previousRows,c.profile.currency);
 const format=(minor:string)=>displayMoney(minor,c.profile.currency,c.profile.locale);
 const debt=plan.debts.filter(d=>d.currency===c.profile.currency).reduce((sum,d)=>sum+BigInt(d.balance_minor),0n);
 const spending=Object.entries(byCategory(rows,c.profile.currency)).sort((a,b)=>BigInt(a[1])>BigInt(b[1])?-1:1);
 const budget=plan.budgets.find(b=>b.month.startsWith(month)&&b.currency===c.profile.currency);
 const changes=anomalies(rows,previousRows,c.profile.currency);
 await c.db.rpc('record_activity',{event_type:'REPORT_VIEWED'});
 return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>
 <form className="filters"><div><label htmlFor="mes">{t.period}</label><input type="month" name="mes" id="mes" defaultValue={month}/></div><Button variant="outline">{t.see}</Button></form>
 <p className="hint">{t.hint(c.profile.currency,month===localMonth(c.profile.timezone))}</p>
 <dl className="metric-grid"><div><dt>{t.income}</dt><dd>{format(current.income.amountMinor)}</dd></div><div><dt>{t.expenses}</dt><dd>{format(current.expenses.amountMinor)}</dd></div><div><dt>{t.net}</dt><dd>{format(current.net.amountMinor)}</dd></div><div><dt>{t.debt}</dt><dd>{format(debt.toString())}</dd></div><div><dt>{t.change}</dt><dd>{previousRows.length?format((BigInt(current.expenses.amountMinor)-BigInt(before.expenses.amountMinor)).toString()):t.noPrevious}</dd></div><div><dt>{t.budget}</dt><dd>{budget?format(budget.amount_minor):t.noBudget}</dd></div></dl>
 <p className="hint">{t.note}</p>
 <section className="section"><h2>{t.top}</h2>{spending.length?<ul className="transaction-list">{spending.map(([id,value])=><li key={id}><span>{categories.find(cat=>cat.id===id)?.name??'Outros'}</span><span>{format(value)}</span></li>)}</ul>:<p>{t.noRows}</p>}</section>
 <section className="section"><h2>{t.attention}</h2><p>{budget?budgetStatusText(budgetStatus(BigInt(current.expenses.amountMinor),BigInt(budget.amount_minor)).status,c.profile.locale):t.budgetPrompt}</p><p>{t.changes(changes.length)}</p></section>
 <section className="section"><h2>{t.actions}</h2><ol className="action-list"><li>{t.a1}</li><li>{t.a2}</li><li>{t.a3}: {c.profile.objective}</li></ol></section>
 {principles.data&&<PrincipleCard reference={principles.data.reference} principle={principles.data.principle} application={principles.data.application} riskContext={principles.data.risk_context}/>}</>;
}