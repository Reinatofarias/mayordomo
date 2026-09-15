import Link from 'next/link';
import {getCategories,getContext,getTransactions,localMonth} from '@/data/finance';
import {byCategory,duplicates,totals} from '@/domain/finance';
import {displayMoney} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';
import {getInternalNotifications} from '@/data/notifications';
import {InternalNotifications} from '@/components/internal-notifications';

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

function devotional(theme:string,application:string){
 const reflections:Record<string,{title:string;reflection:string;practice:string;prayer:string}>={
  deuda:{title:'Libertad para decidir con calma',reflection:'La deuda puede reducir margen y tranquilidad. Mirarla de frente es un acto de prudencia, no de vergüenza.',practice:'Elige una deuda y confirma saldo, pago mínimo y fecha de vencimiento.',prayer:'Señor, ayúdame a decidir con claridad, paciencia y responsabilidad.'},
  ahorro:{title:'Preparar sin ansiedad',reflection:'Guardar recursos cuando es posible puede proteger a tu familia y darte margen para servir mejor.',practice:'Define una cantidad pequeña que puedas separar sin descuidar necesidades básicas.',prayer:'Dame sabiduría para cuidar lo que recibo y paz para avanzar paso a paso.'},
  prudencia:{title:'Pausar antes de actuar',reflection:'La prudencia no paraliza; abre espacio para decidir con información y dominio propio.',practice:'Antes de un gasto no esencial, espera 10 minutos y revisa tu categoría principal.',prayer:'Guíame a reconocer riesgos sin miedo y a actuar con templanza.'},
  mayordomía:{title:'Administrar con propósito',reflection:'La mayordomía conecta tus recursos con tus valores, tu familia y tu servicio.',practice:'Elige una decisión financiera de hoy y relaciónala con el propósito que declaraste.',prayer:'Enséñame a administrar con fidelidad, humildad y amor.'},
  responsabilidad:{title:'Fidelidad en lo pequeño',reflection:'Un registro pequeño también cuenta. La claridad se construye con hábitos sencillos.',practice:'Registra el próximo movimiento que recuerdes, aunque sea pequeño.',prayer:'Ayúdame a ser fiel en lo pequeño sin cargar culpa ni perfeccionismo.'},
  sabiduría:{title:'Buscar sabiduría antes de decidir',reflection:'La sabiduría crece cuando observas, comparas y decides con calma.',practice:application||'Revisa tus números antes de tomar la siguiente decisión financiera.',prayer:'Dame sabiduría para usar bien mis recursos y servir con libertad.'}
 };
 return reflections[theme]??reflections['sabiduría'];
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
 const [{data:principle},notifications]=await Promise.all([
  db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme',theme).eq('active',true).single(),
  getInternalNotifications(context,{hasRows:rows.length>0,net,reserve,debt})
 ]);
 const action=todayAction({hasRows:rows.length>0,net,topCategory,duplicatesCount:candidates.length,objective:p.objective});
 const daily=devotional(theme,principle?.application??'');
 return <><header className="page-heading"><p className="eyebrow">TU DINERO, CON PROPÓSITO</p><h1>Buenos días, {p.name}.</h1><p>Esto es lo que necesitas saber sobre tu dinero hoy.</p></header>
 <InternalNotifications items={notifications}/>
 <section className="balance-panel"><span>Balance de movimientos del mes</span><strong>{format(total.net.amountMinor)}</strong><p>Ingresos registrados menos gastos registrados. No es tu saldo bancario.</p><div className="balance-details"><div>Ingresos del mes<b>{format(total.income.amountMinor)}</b></div><div>Gastos del mes<b>{format(total.expenses.amountMinor)}</b></div></div></section>
 <section className="devotional-card"><p className="eyebrow">DEVOCIONAL FINANCIERO DE HOY</p><h2>{daily.title}</h2><p>{daily.reflection}</p><div><strong>Aplicación práctica</strong><span>{daily.practice}</span></div><div><strong>Oración/reflexión opcional</strong><span>{daily.prayer}</span></div><small>Esto no es una promesa de resultado financiero ni una medida de fe. Es una guía para decidir con calma.</small></section>
 <section className="daily-guidance"><div><p className="eyebrow">UNA ACCIÓN PRUDENTE PARA HOY</p><h2>{action}</h2><p>{topCategory?`La categoría con más peso registrado este mes es ${topCategory}.`:'Todavía falta registrar movimientos para identificar patrones.'}</p></div>{principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}</section>
 <div className="page-actions"><Button asChild><Link href="/movimientos/nuevo">Registrar movimiento</Link></Button><Button asChild variant="outline"><Link href="/importar">Subir extracto</Link></Button></div>
 <section className="section"><h2>Tu punto de partida</h2><p>Estimaciones que compartiste al comenzar.</p><dl className="metric-grid"><div><dt>Disponible estimado mensual</dt><dd>{format((BigInt(p.monthly_income_minor)-BigInt(p.fixed_expenses_minor)).toString())}</dd></div><div><dt>Reserva inicial</dt><dd>{format(p.reserve_minor)}</dd></div><div><dt>Deuda inicial</dt><dd>{format(p.opening_debt_minor)}</dd></div></dl></section>
 <section className="section"><p className="eyebrow">MAYORDOMO DETECTÓ</p>{!rows.length?<><h2>Aún no conozco tus movimientos.</h2><p>Registra tu primer gasto y empezaré a ayudarte.</p></>:<><h2>{net<0n?'Tus gastos registrados superan tus ingresos.':'Ya estás dando orden a tu dinero.'}</h2><p>{candidates.length?candidates.length+' posibles duplicidades merecen una revisión.':'Continúa registrando para tener una visión más completa.'}</p></>}<Link href="/informe">Ver Informe de Mayordomía →</Link></section></>;
}
