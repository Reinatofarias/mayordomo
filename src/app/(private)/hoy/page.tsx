import Link from 'next/link';
import {getCategories,getContext,getTransactions,localMonth} from '@/data/finance';
import {byCategory,duplicates,totals} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';

function chooseTodayPrinciple({hasRows,net,debt,reserve,objective}:{hasRows:boolean;net:bigint;debt:bigint;reserve:bigint;objective:string|null}){
 if(debt>0n||objective==='Salir de deudas')return 'deuda';
 if(reserve===0n||objective==='Crear una reserva')return 'ahorro';
 if(hasRows&&net<0n)return 'prudencia';
 if(objective==='Ser más fiel en la administración')return 'mayordomía';
 if(!hasRows)return 'responsabilidad';
 return 'sabiduría';
}

function todayAction({hasRows,net,topCategory,duplicatesCount,objective}:{hasRows:boolean;net:bigint;topCategory?:string;duplicatesCount:number;objective:string|null}){
 if(!hasRows)return 'Registra tu primer movimiento hoy. La claridad crece cuando lo pequeño también queda visible.';
 if(duplicatesCount>0)return `Revisa ${duplicatesCount} posible${duplicatesCount===1?' duplicidad':'s duplicidades'} antes de tomar decisiones con estos números.`;
 if(net<0n)return `Haz una pausa antes de un nuevo gasto y revisa ${topCategory??'tu categoría principal'} con prudencia.`;
 if(objective==='Crear una reserva')return 'Separa una cantidad pequeña y realista para tu reserva antes de aumentar gastos flexibles.';
 if(objective==='Salir de deudas')return 'Revisa cuál deuda necesita atención esta semana y evita asumir nuevos compromisos sin comparar tu margen.';
 return `Observa ${topCategory??'tu categoría principal'} y decide un límite sencillo para las próximas 24 horas.`;
}

export default async function Today(){
 const context=await getContext();const {profile:p,db}=context;const month=localMonth(p.timezone);
 const [rows,categories]=await Promise.all([getTransactions(context,month),getCategories(context)]);const total=totals(rows,p.currency);
 const categoryNames=new Map(categories.map(c=>[c.id,c.name]));
 const categoryTotals=Object.entries(byCategory(rows,p.currency)).sort((a,b)=>BigInt(a[1])>BigInt(b[1])?-1:1);
 const topCategory=categoryTotals[0]?categoryNames.get(categoryTotals[0][0])??'Otros':undefined;
 const format=(minor:string)=>displayMoney(minor,p.currency,p.locale);const candidates=duplicates(rows);
 const net=BigInt(total.net.amountMinor),debt=BigInt(p.opening_debt_minor),reserve=BigInt(p.reserve_minor);
 const theme=chooseTodayPrinciple({hasRows:rows.length>0,net,debt,reserve,objective:p.objective});
 const {data:principle}=await db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme',theme).eq('active',true).single();
 const action=todayAction({hasRows:rows.length>0,net,topCategory,duplicatesCount:candidates.length,objective:p.objective});
 return <><header className="page-heading"><p className="eyebrow">TU DINERO, CON PROPÓSITO</p><h1>Buenos días, {p.name}.</h1><p>Esto es lo que necesitas saber sobre tu dinero hoy.</p></header>
 <section className="balance-panel"><span>Balance de movimientos del mes</span><strong>{format(total.net.amountMinor)}</strong><p>Ingresos registrados menos gastos registrados. No es tu saldo bancario.</p><div className="balance-details"><div>Ingresos del mes<b>{format(total.income.amountMinor)}</b></div><div>Gastos del mes<b>{format(total.expenses.amountMinor)}</b></div></div></section>
 <section className="daily-guidance"><div><p className="eyebrow">UNA ACCIÓN PRUDENTE PARA HOY</p><h2>{action}</h2><p>{topCategory?`La categoría con más peso registrado este mes es ${topCategory}.`:'Todavía falta registrar movimientos para identificar patrones.'}</p></div>{principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}</section>
 <div className="page-actions"><Button asChild><Link href="/movimientos/nuevo">Registrar movimiento</Link></Button><Button asChild variant="outline"><Link href="/importar">Subir extracto</Link></Button></div>
 <section className="section"><h2>Tu punto de partida</h2><p>Estimaciones que compartiste al comenzar.</p><dl className="metric-grid"><div><dt>Disponible estimado mensual</dt><dd>{format((BigInt(p.monthly_income_minor)-BigInt(p.fixed_expenses_minor)).toString())}</dd></div><div><dt>Reserva inicial</dt><dd>{format(p.reserve_minor)}</dd></div><div><dt>Deuda inicial</dt><dd>{format(p.opening_debt_minor)}</dd></div></dl></section>
 <section className="section"><p className="eyebrow">MAYORDOMO DETECTÓ</p>{!rows.length?<><h2>Aún no conozco tus movimientos.</h2><p>Registra tu primer gasto y empezaré a ayudarte.</p></>:<><h2>{net<0n?'Tus gastos registrados superan tus ingresos.':'Ya estás dando orden a tu dinero.'}</h2><p>{candidates.length?candidates.length+' posibles duplicidades merecen una revisión.':'Continúa registrando para tener una visión más completa.'}</p></>}<Link href="/informe">Ver Informe de Mayordomía →</Link></section></>;
}
