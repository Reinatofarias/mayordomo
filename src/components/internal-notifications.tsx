import Link from 'next/link';
import {Bell} from 'lucide-react';
import {markNotificationsRead} from '@/app/(private)/notificaciones/actions';
import type {InternalNotification} from '@/data/notifications';
import {formatDateTime,languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';

const copy={
 es:{aria:'Notificaciones internas',eyebrow:'NOTIFICACIONES',title:'Señales para revisar',mark:'Marcar leídas',center:'Ver centro de notificaciones ->'},
 pt:{aria:'Notificações internas',eyebrow:'NOTIFICAÇÕES',title:'Sinais para revisar',mark:'Marcar lidas',center:'Ver central de notificações ->'}
};

export function InternalNotifications({items,showAllLink=true,locale='es-MX'}:{items:InternalNotification[];showAllLink?:boolean;locale?:string}){
 if(!items.length)return null;
 const t=copy[languageFromLocale(locale)];
 return <section className="notification-center" aria-label={t.aria}>
  <div className="notification-heading"><div><p className="eyebrow">{t.eyebrow}</p><h2>{t.title}</h2></div><form action={markNotificationsRead}>{items.filter(item=>item.dismissible).map(item=><input key={item.id} type="hidden" name="dismissKey" value={item.id}/>) }<Button variant="outline">{t.mark}</Button></form></div>
  <div className="notification-list">{items.map(item=><article key={item.id} data-kind={item.kind}><Bell size={18} aria-hidden="true"/><div><strong>{item.title}</strong><p>{item.message}</p>{item.createdAt&&<small>{formatDateTime(item.createdAt,locale)}</small>}</div></article>)}</div>
  {showAllLink&&<Link className="text-link" href="/notificaciones">{t.center}</Link>}
 </section>;
}