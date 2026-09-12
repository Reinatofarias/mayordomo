import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
export default async function Recovery({searchParams}:{searchParams:Promise<{modo?:string;code?:string}>}) {
 const {modo}=await searchParams;
 return <main className="auth-shell"><Link className="brand" href="/">MAYORDOMO</Link><section className="auth-panel"><h1>Recupera tu acceso.</h1><p>Te acompañamos para volver a entrar.</p><AuthForm mode={modo==='nueva'?'password':'recover'}/><Link href="/acceso">Volver al inicio de sesión</Link></section></main>;
}
