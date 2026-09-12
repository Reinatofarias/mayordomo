'use client';
import {Button} from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="empty"><h1>No pudimos cargar esta información.</h1><p>Tu solicitud no se completó. Inténtalo nuevamente en unos momentos.</p><Button onClick={reset}>Volver a intentar</Button></section>;}
