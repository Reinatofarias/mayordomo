import Link from 'next/link';
import {getContext} from '@/data/finance';
import {initialSnapshot} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
export default async function MapPage({searchParams}:{searchParams:Promise<{inicio?:string}>}){
 const {profile:p,db}=await getContext();const {inicio}=await searchParams;
 const s=initialSnapshot(BigInt(p.monthly_income_minor),BigInt(p.fixed_expenses_minor),BigInt(p.opening_debt_minor),BigInt(p.reserve_minor),p.currency);
 const {data:principle}=await db.from('biblical_principles').select('reference,principle,application').eq('theme','planificación').eq('active',true).single();
 const items=[['Ingreso mensual',s.income],['Comprometido',s.committed],['Disponible',s.available],['Deudas',s.debt],['Reserva',s.reserve]] as const;
 return <main className="auth-shell"><span className="brand">MAYORDOMO</span><section className="onboarding"><p className="eyebrow">TU PUNTO DE PARTIDA</p><h1>Tu mapa financiero está listo.</h1><p>Este resumen se basa en tus estimaciones iniciales.</p><span className="status">{s.status}</span><dl className="metric-grid">{items.map(([label,m])=><div key={label}><dt>{label}</dt><dd>{displayMoney(m.amountMinor,m.currency,p.locale)}</dd></div>)}</dl><h2>Tu objetivo: {p.objective}</h2><h3>Este mes necesitas prestar atención a…</h3><p>{BigInt(s.available.amountMinor)<0n?'Tus compromisos superan tu ingreso estimado. Revisa cuáles puedes ajustar.':'La diferencia entre lo que estimas y lo que realmente gastas.'}</p><ol className="action-list"><li>Registra tus movimientos durante los próximos siete días.</li><li>Revisa tus gastos fijos y elige uno que puedas ajustar.</li><li>Define un presupuesto realista antes de asumir nuevos compromisos.</li></ol>{principle&&<blockquote><p>{principle.principle}</p><cite>{principle.reference} · Paráfrasis</cite></blockquote>}<Button asChild><Link href={inicio==='import'?'/importar':'/movimientos/nuevo'}>Dar mi primer paso</Link></Button><p><Link href="/hoy">Ir a Hoy</Link></p></section></main>;
}
