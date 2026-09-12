import Link from 'next/link';
import {getContext} from '@/data/finance';
import {hasProductAccess,hotmartCheckoutUrl} from '@/data/access';
import {signOut} from '@/app/auth-actions';
import {refreshHotmartAccess} from '@/app/acceso/pendiente/actions';
import {SupportForm} from '@/components/support-form';
import {Button} from '@/components/ui/button';

export default async function Profile(){
 const c=await getContext(false);
 const checkout=hotmartCheckoutUrl();
 const [access,{data:subscriptions},{data:requests}]=await Promise.all([
  hasProductAccess(c.db),
  c.db.from('subscriptions').select('id,provider,plan,status,purchased_at,renewal_at,access_until').eq('user_id',c.user.id),
  c.db.from('support_requests').select('id,subject,status,created_at').eq('user_id',c.user.id).order('created_at',{ascending:false}).limit(10)
 ]);
 return <>
  <header className="page-heading"><p className="eyebrow">TU CUENTA</p><h1>{c.profile.name}</h1><p>{c.user.email}</p></header>
  <dl className="metric-grid"><div><dt>País</dt><dd>{c.profile.country}</dd></div><div><dt>Moneda</dt><dd>{c.profile.currency}</dd></div><div><dt>Acceso</dt><dd>{access?'Activo':'Pendiente'}</dd></div></dl>
  <section className="section">
   <h2>Facturación y acceso</h2>
   {!access&&<p className="status-warning">Tu acceso de producto todavía no está activo. Si ya compraste, revisa el acceso con el mismo correo de Hotmart.</p>}
   {subscriptions?.length?subscriptions.map(s=><article key={s.id} className="billing-card">
    <h3>{s.plan}</h3>
    <p>Proveedor: {s.provider} · Estado: {s.status}</p>
    <p>Compra: {s.purchased_at??'No disponible'}<br/>Renovación: {s.renewal_at??'No disponible'}<br/>Acceso hasta: {s.access_until??'No disponible'}</p>
    <Button asChild variant="outline"><a href="https://consumer.hotmart.com/" target="_blank" rel="noopener noreferrer">Administrar en Hotmart</a></Button>
   </article>):<p>No hay una suscripción registrada para este correo.</p>}
   <div className="page-actions">
    <form action={refreshHotmartAccess}><Button variant="outline">Revisar acceso Hotmart</Button></form>
    {checkout&&<Button asChild><a href={checkout} target="_blank" rel="noopener noreferrer">Comprar acceso</a></Button>}
   </div>
   <p className="hint">Para cancelar o cambiar datos de pago, usa el portal de Hotmart. Si compraste con otro correo, solicita soporte.</p>
   <Link href="#soporte">Solicitar ayuda →</Link>
  </section>
  <section className="section" id="soporte"><h2>Soporte</h2><SupportForm/>{requests?.map(r=><p key={r.id}>{r.subject} · {r.status==='OPEN'?'Recibida':r.status}</p>)}</section>
  <section className="section"><form action={signOut}><Button variant="outline">Cerrar sesión</Button></form></section>
 </>;
}
