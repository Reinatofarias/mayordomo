import {Bell} from 'lucide-react';
import {markNotificationsRead} from '@/app/(private)/notificaciones/actions';
import type {InternalNotification} from '@/data/notifications';
import {Button} from '@/components/ui/button';

export function InternalNotifications({items}:{items:InternalNotification[]}){
 if(!items.length)return null;
 return <section className="notification-center" aria-label="Notificaciones internas">
  <div className="notification-heading"><div><p className="eyebrow">NOTIFICACIONES</p><h2>Señales para revisar</h2></div><form action={markNotificationsRead}><Button variant="outline">Marcar leídas</Button></form></div>
  <div className="notification-list">{items.map(item=><article key={item.id} data-kind={item.kind}><Bell size={18} aria-hidden="true"/><div><strong>{item.title}</strong><p>{item.message}</p></div></article>)}</div>
 </section>;
}
