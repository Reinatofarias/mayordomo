import Link from 'next/link';
import {getContext,getTransactions,localMonth} from '@/data/finance';
import {totals,duplicates} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
export default async function Today(){
 const context=await getContext();const {profile:p}=context;
 const rows=await getTransactions(context,localMonth(p.timezone));const total=totals(rows,p.currency);
 const format=(minor:string)=>displayMoney(minor,p.currency,p.locale);const candidates=duplicates(rows);
 return <><header className="page-heading"><p className="eyebrow">TU DINERO, CON PROPÓSITO</p><h1>Buenos días, {p.name}.</h1><p>Esto es lo que necesitas saber sobre tu dinero hoy.</p></header>
 <section className="balance-panel"><span>Balance de movimientos del mes</span><strong>{format(total.net.amountMinor)}</strong><p>Ingresos registrados menos gastos registrados. No es tu saldo bancario.</p><div className="balance-details"><div>Ingresos del mes<b>{format(total.income.amountMinor)}</b></div><div>Gastos del mes<b>{format(total.expenses.amountMinor)}</b></div></div></section>
 <div className="page-actions"><Button asChild><Link href="/movimientos/nuevo">Registrar movimiento</Link></Button><Button asChild variant="outline"><Link href="/importar">Subir extracto</Link></Button></div>
 <section className="section"><h2>Tu punto de partida</h2><p>Estimaciones que compartiste al comenzar.</p><dl className="metric-grid"><div><dt>Disponible estimado mensual</dt><dd>{format((BigInt(p.monthly_income_minor)-BigInt(p.fixed_expenses_minor)).toString())}</dd></div><div><dt>Reserva inicial</dt><dd>{format(p.reserve_minor)}</dd></div><div><dt>Deuda inicial</dt><dd>{format(p.opening_debt_minor)}</dd></div></dl></section>
 <section className="section"><p className="eyebrow">MAYORDOMO DETECTÓ</p>{!rows.length?<><h2>Aún no conozco tus movimientos.</h2><p>Registra tu primer gasto y empezaré a ayudarte.</p></>:<><h2>{BigInt(total.net.amountMinor)<0n?'Tus gastos registrados superan tus ingresos.':'Ya estás dando orden a tu dinero.'}</h2><p>{candidates.length?candidates.length+' posibles duplicidades merecen una revisión.':'Continúa registrando para tener una visión más completa.'}</p></>}<Link href="/informe">Ver Informe de Mayordomía →</Link></section></>;
}
