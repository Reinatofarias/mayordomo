import Link from 'next/link';
import {ArrowUpRight,CheckCircle2,RefreshCw} from 'lucide-react';
import {redirect} from 'next/navigation';
import {requireUser} from '@/data/supabase';
import {claimPendingProductAccess,hasProductAccess,hotmartCheckoutUrl} from '@/data/access';
import {Button} from '@/components/ui/button';
import {Brand} from '@/components/brand';
import {refreshHotmartAccess} from './actions';

export const metadata={title:'Liberar acceso'};

export default async function PendingAccess({searchParams}:{searchParams:Promise<{estado?:string}>}){
 const {estado}=await searchParams;
 const {db,user}=await requireUser();
 await claimPendingProductAccess(db);
 if(await hasProductAccess(db))redirect('/hoy');
 const checkout=hotmartCheckoutUrl();
 return <main className="auth-shell">
  <Brand href="/" />
  <section className="auth-panel access-panel">
   <p className="eyebrow">ACCESO MAYORDOMO</p>
   <h1>Tu compra libera la plataforma.</h1>
   <p>Usa en Hotmart el mismo correo con el que entraste aquí: <strong>{user.email}</strong>. Cuando Hotmart confirme el pago, MAYORDOMO registra tu acceso automáticamente.</p>
   {estado==='pendiente'&&<p role="status" className="status-warning">Todavía no encontramos una compra aprobada para este correo. Si acabas de pagar, espera unos minutos y vuelve a revisar.</p>}
   <div className="access-steps">
    <article><CheckCircle2 aria-hidden="true"/><h2>1. Compra el producto</h2><p>Finaliza la compra en Hotmart con este mismo correo.</p></article>
    <article><CheckCircle2 aria-hidden="true"/><h2>2. Confirma tu email</h2><p>Tu cuenta de MAYORDOMO necesita estar confirmada para vincular la compra.</p></article>
    <article><CheckCircle2 aria-hidden="true"/><h2>3. Revisa el acceso</h2><p>Si el pago ya fue aprobado, el botón de abajo libera tu entrada.</p></article>
   </div>
   <div className="page-actions">
    {checkout?<Button asChild><a href={checkout} target="_blank" rel="noopener noreferrer">Comprar en Hotmart <ArrowUpRight aria-hidden="true"/></a></Button>:<Button asChild><Link href="/soporte">Pedir link de compra</Link></Button>}
    <form action={refreshHotmartAccess}><Button variant="outline"><RefreshCw aria-hidden="true"/> Revisar mi acceso</Button></form>
   </div>
   <p className="hint">Si compraste con otro correo, solicita ayuda para vincularlo manualmente.</p>
   <Link href="/soporte">Ir a soporte</Link>
  </section>
 </main>;
}
