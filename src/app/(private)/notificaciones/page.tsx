import {getContext,getTransactions,localMonth} from '@/data/finance';
import {getPlan} from '@/data/plan';
import {totals} from '@/domain/finance';
import {getInternalNotifications} from '@/data/notifications';
import {InternalNotifications} from '@/components/internal-notifications';
import {languageFromLocale} from '@/i18n/app';
import Link from 'next/link';

const copy={
 es:{eyebrow:'CENTRO DE NOTIFICACIONES',title:'Tus señales para revisar',intro:'Aquí concentramos recordatorios, alertas de soporte y avisos calculados con tus datos reales.',emptyTitle:'No hay notificaciones pendientes.',emptyText:'Cuando haya algo importante para revisar, aparecerá aquí.',back:'Volver a Hoy ->'},
 pt:{eyebrow:'CENTRAL DE NOTIFICAÇÕES',title:'Seus sinais para revisar',intro:'Aqui concentramos lembretes, alertas de suporte e avisos calculados com seus dados reais.',emptyTitle:'Não há notificações pendentes.',emptyText:'Quando houver algo importante para revisar, aparecerá aqui.',back:'Voltar para Hoje ->'}
};

export default async function NotificationsPage(){
 const context=await getContext(false);const month=localMonth(context.profile.timezone);const t=copy[languageFromLocale(context.profile.locale)];
 const [rows,plan]=await Promise.all([getTransactions(context,month),getPlan(context)]);
 const total=totals(rows,context.profile.currency);
 const reserve=BigInt(context.profile.reserve_minor),debt=plan.debts.filter(d=>d.currency===context.profile.currency).reduce((sum,d)=>sum+BigInt(d.balance_minor),BigInt(context.profile.opening_debt_minor));
 const items=await getInternalNotifications(context,{hasRows:rows.length>0,net:BigInt(total.net.amountMinor),reserve,debt,limit:30});
 return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>{items.length?<InternalNotifications items={items} showAllLink={false} locale={context.profile.locale}/>:<section className="empty"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><Link href="/hoy">{t.back}</Link></section>}</>;
}