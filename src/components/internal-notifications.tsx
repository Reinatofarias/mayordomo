import Link from 'next/link';
import {Bell} from 'lucide-react';
import {markNotificationsRead} from '@/app/(private)/notificaciones/actions';
import type {InternalNotification} from '@/data/notifications';
import {Button} from '@/components/ui/button';

export function InternalNotifications({items,showAllLink=true}:{items:InternalNotification[];showAllLink?:boolean}){
 if(!items.length)return null;
 return <section className="notification-center" aria-label="Notificaciones internas">
  <div className="notification-heading"><div><p className="eyebrow">NOTIFICACIONES</p><h2>Senales para revisar</h2></div><form action={markNotificationsRead}>{items.filter(item=>item.dismissible).map(item=><input key={item.id} type="hidden" name="dismissKey" value={item.id}/>) }<Button variant="outline">Marcar leidas</Button></form></div>
  <div className="notification-list">{items.map(item=><article key={item.id} data-kind={item.kind}><Bell size={18} aria-hidden="true"/><div><strong>{item.title}</strong><p>{item.message}</p>{item.createdAt&&<small>{new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.createdAt))}</small>}</div></article>)}</div>
  {showAllLink&&<Link className="text-link" href="/notificaciones">Ver centro de notificaciones -&gt;</Link>}
 </section>;
}