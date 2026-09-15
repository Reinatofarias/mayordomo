import Link from 'next/link';
import {getContext} from '@/data/finance';
import {initialSnapshot} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';

function principleTheme(status:string,debt:bigint,reserve:bigint,objective:string|null){
 if(debt>0n||objective==='Salir de deudas')return 'deuda';
 if(reserve===0n||objective==='Crear una reserva')return 'ahorro';
 if(status==='Necesitas actuar'||objective==='Gastar con más prudencia')return 'prudencia';
 if(objective==='Ser más fiel en la administración')return 'mayordomía';
 return 'sabiduría';
}

export default async function MapPage({searchParams}:{searchParams:Promise<{inicio?:string}>}){
 const {profile:p,db}=await getContext();const {inicio}=await searchParams;
 const debt=BigInt(p.opening_debt_minor),reserve=BigInt(p.reserve_minor);
 const s=initialSnapshot(BigInt(p.monthly_income_minor),BigInt(p.fixed_expenses_minor),debt,reserve,p.currency);
 const theme=principleTheme(s.status,debt,reserve,p.objective);
 const {data:principle}=await db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme',theme).eq('active',true).single();
 const items=[['Ingreso mensual',s.income],['Comprometido',s.committed],['Disponible',s.available],['Deudas',s.debt],['Reserva',s.reserve]] as const;
 const needsAttention=BigInt(s.available.amountMinor)<0n;
 return <main className="auth-shell"><span className="brand">MAYORDOMO</span><section className="onboarding onboarding-map"><p className="eyebrow">TU PUNTO DE PARTIDA</p><h1>Tu mapa financiero está listo.</h1><p className="lead">Este resumen se basa en tus estimaciones iniciales. La mayordomía empieza con claridad, no con culpa.</p><span className="status">{s.status}</span><dl className="metric-grid">{items.map(([label,m])=><div key={label}><dt>{label}</dt><dd>{displayMoney(m.amountMinor,m.currency,p.locale)}</dd></div>)}</dl><h2>Tu objetivo: {p.objective}</h2><h3>Este mes necesitas prestar atención a…</h3><p>{needsAttention?'Tus compromisos superan tu ingreso estimado. Revisa cuáles puedes ajustar antes de asumir nuevos gastos.':'La diferencia entre lo que estimas y lo que realmente gastas. Registrar movimientos te dará una lectura más fiel.'}</p>{principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}<ol className="action-list"><li>Registra tus movimientos durante los próximos siete días.</li><li>Revisa tus gastos fijos y elige uno que puedas ajustar con prudencia.</li><li>Define un presupuesto realista antes de asumir nuevos compromisos.</li></ol><Button asChild><Link href={inicio==='import'?'/importar':'/movimientos/nuevo'}>Dar mi primer paso</Link></Button><p><Link href="/hoy">Ir a Hoy</Link></p></section></main>;
}
