import Link from 'next/link';
import {getContext} from '@/data/finance';
import {hasProductAccess,hotmartCheckoutUrl} from '@/data/access';
import {signOut} from '@/app/auth-actions';
import {refreshHotmartAccess} from '@/app/acceso/pendiente/actions';
import {ProfileForm} from '@/components/profile-form';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';
import {displayMoney} from '@/i18n/es';

function formatDate(value:string|null|undefined,locale:string){
 if(!value)return 'No disponible';
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(value));
}

export default async function Profile(){
 const c=await getContext(false);
 const checkout=hotmartCheckoutUrl();
 const [access,{data:subscriptions},{data:requests},{data:principle},{count:transactionCount},{count:budgetCount},{count:goalCount},{count:debtCount},{count:supportCount}]=await Promise.all([
  hasProductAccess(c.db),
  c.db.from('subscriptions').select('id,provider,plan,status,purchased_at,renewal_at,access_until').eq('user_id',c.user.id).order('created_at',{ascending:false}),
  c.db.from('support_requests').select('id,subject,status,created_at').eq('user_id',c.user.id).order('created_at',{ascending:false}).limit(10),
  c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','mayordomía').eq('active',true).single(),
  c.db.from('transactions').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('budgets').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('goals').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('debts').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('support_requests').select('id',{count:'exact',head:true}).eq('user_id',c.user.id)
 ]);
 const monthlyIncome=displayMoney(c.profile.monthly_income_minor,c.profile.currency,c.profile.locale);
 const fixedExpenses=displayMoney(c.profile.fixed_expenses_minor,c.profile.currency,c.profile.locale);
 const reserve=displayMoney(c.profile.reserve_minor,c.profile.currency,c.profile.locale);
 const planItems=(budgetCount??0)+(goalCount??0)+(debtCount??0);
 return <>
  <header className="page-heading"><p className="eyebrow">CENTRO DE MAYORDOMIA</p><h1>{c.profile.name||'Tu perfil'}</h1><p>{c.user.email}</p></header>
  <section className="profile-hero">
   <div>
    <p className="eyebrow">TU CONTEXTO</p>
    <h2>Una experiencia financiera guiada por proposito.</h2>
    <p>MAYORDOMO usa tu perfil para ordenar los datos, sugerir proximos pasos y recordar principios biblicos sin presion ni culpa.</p>
   </div>
   {principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}
  </section>
  <dl className="metric-grid profile-metrics"><div><dt>Pais</dt><dd>{c.profile.country}</dd></div><div><dt>Moneda</dt><dd>{c.profile.currency}</dd></div><div><dt>Acceso</dt><dd>{access?'Activo':'Pendiente'}</dd></div><div><dt>Ingreso estimado</dt><dd>{monthlyIncome}</dd></div><div><dt>Gastos fijos</dt><dd>{fixedExpenses}</dd></div><div><dt>Reserva</dt><dd>{reserve}</dd></div></dl>
  <section className="section profile-sections">
   <article>
    <h2>Datos personales</h2>
    <p>Actualiza pais, moneda, idioma y zona horaria para que los reportes se muestren con el formato correcto.</p>
    <ProfileForm profile={{name:c.profile.name,phone:c.profile.phone,country:c.profile.country,currency:c.profile.currency,locale:c.profile.locale,timezone:c.profile.timezone}}/>
   </article>
   <article>
    <h2>Datos registrados</h2>
    <dl className="usage-breakdown"><div><dt>Movimientos</dt><dd>{transactionCount??0}</dd></div><div><dt>Plan</dt><dd>{planItems}</dd></div><div><dt>Soporte</dt><dd>{supportCount??0}</dd></div></dl>
    <p className="hint">Estos numeros muestran registros reales creados por ti: movimientos, presupuestos/metas/deudas y solicitudes de soporte.</p>
   </article>
  </section>
  <section className="section">
   <h2>Facturacion y acceso</h2>
   {!access&&<p className="status-warning">Tu acceso de producto todavia no esta activo. Si ya compraste, revisa el acceso con el mismo correo de Hotmart.</p>}
   {subscriptions?.length?subscriptions.map(s=><article key={s.id} className="billing-card">
    <h3>{s.plan}</h3>
    <p>Proveedor: {s.provider} · Estado: {s.status}</p>
    <p>Compra: {formatDate(s.purchased_at,c.profile.locale)}<br/>Renovacion: {formatDate(s.renewal_at,c.profile.locale)}<br/>Acceso hasta: {formatDate(s.access_until,c.profile.locale)}</p>
    <Button asChild variant="outline"><a href="https://consumer.hotmart.com/" target="_blank" rel="noopener noreferrer">Administrar en Hotmart</a></Button>
   </article>):<p>No hay una suscripcion registrada para este correo.</p>}
   <div className="page-actions">
    <form action={refreshHotmartAccess}><Button variant="outline">Revisar acceso Hotmart</Button></form>
    {checkout&&<Button asChild><a href={checkout} target="_blank" rel="noopener noreferrer">Comprar acceso</a></Button>}
   </div>
   <p className="hint">Para cancelar o cambiar datos de pago, usa el portal de Hotmart. Si compraste con otro correo, solicita soporte.</p>
   <Link href="#soporte">Solicitar ayuda -&gt;</Link>
  </section>
  <section className="section" id="soporte"><h2>Soporte</h2><p>Usa el boton flotante de ayuda en la esquina inferior. Primero veras dudas frecuentes y respuestas preparadas; si aun necesitas ayuda, el Gemini responde antes de escalar a humano.</p>{requests?.length?<div className="support-history"><h3>Solicitudes recientes</h3>{requests.map(r=><article key={r.id}><strong>{r.subject}</strong><span>{r.status==='OPEN'?'Recibida':r.status} · {formatDate(r.created_at,c.profile.locale)}</span></article>)}</div>:<p className="hint">Aun no tienes solicitudes registradas.</p>}</section>
  <section className="section"><form action={signOut}><Button variant="outline">Cerrar sesion</Button></form></section>
 </>;
}