import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
export default async function Access({searchParams}:{searchParams:Promise<{modo?:string;estado?:string}>}) {
 const {modo,estado}=await searchParams; const signup=modo==='registro';
 return <main className="auth-shell"><Link className="brand" href="/">MAYORDOMO</Link><section className="auth-panel"><p className="eyebrow">UN NUEVO COMIENZO</p><h1>{signup?'Tu dinero tiene una historia.':'Qué bueno verte de nuevo.'}</h1><p>{signup?'Vamos a entenderla juntos.':'Continúa administrando con propósito.'}</p>{estado&&<p role="status">El acceso aún no está disponible o el enlace expiró. Inténtalo de nuevo.</p>}<AuthForm mode={signup?'signup':'login'}/><p><Link href={signup?'/acceso':'/acceso?modo=registro'}>{signup?'Ya tengo una cuenta':'Crear una cuenta'}</Link></p><Link href="/recuperar">Olvidé mi contraseña</Link></section></main>;
}
