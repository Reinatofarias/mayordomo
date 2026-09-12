import Link from 'next/link';
export const metadata={title:'Soporte'};
export default function Support(){return <main className="legal"><Link className="brand" href="/">MAYORDOMO</Link><h1>Estamos para ayudarte.</h1><p>Si ya tienes una cuenta, inicia sesión para registrar y consultar una solicitud.</p><p><Link href="/perfil#soporte">Ir a Soporte →</Link></p><p><Link href="/recuperar">Recuperar mi acceso</Link></p><p>El canal público de atención se publicará antes del lanzamiento comercial.</p></main>;}
