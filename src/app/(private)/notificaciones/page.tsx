import {getContext,getTransactions,localMonth} from '@/data/finance';
import {getPlan} from '@/data/plan';
import {totals} from '@/domain/finance';
import {getInternalNotifications} from '@/data/notifications';
import {InternalNotifications} from '@/components/internal-notifications';
import Link from 'next/link';

export default async function NotificationsPage(){
 const context=await getContext(false);const month=localMonth(context.profile.timezone);
 const [rows,plan]=await Promise.all([getTransactions(context,month),getPlan(context)]);
 const total=totals(rows,context.profile.currency);
 const reserve=BigInt(context.profile.reserve_minor),debt=plan.debts.filter(d=>d.currency===context.profile.currency).reduce((sum,d)=>sum+BigInt(d.balance_minor),BigInt(context.profile.opening_debt_minor));
 const items=await getInternalNotifications(context,{hasRows:rows.length>0,net:BigInt(total.net.amountMinor),reserve,debt,limit:30});
 return <><header className="page-heading"><p className="eyebrow">CENTRO DE NOTIFICACIONES</p><h1>Tus senales para revisar</h1><p>Aqui concentramos recordatorios, alertas de soporte y avisos calculados con tus datos reales.</p></header>{items.length?<InternalNotifications items={items} showAllLink={false}/>:<section className="empty"><h2>No hay notificaciones pendientes.</h2><p>Cuando haya algo importante para revisar, aparecera aqui.</p><Link href="/hoy">Volver a Hoy -&gt;</Link></section>}</>;
}