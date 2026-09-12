import Link from 'next/link';
import {ArrowUpRight,BarChart3,Heart,Leaf} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Brand} from '@/components/brand';
import {hotmartCheckoutUrl} from '@/data/access';

export default function Home(){
 const checkout=hotmartCheckoutUrl();
 return <>
  <header className="public-header">
   <Brand href="/" />
   <Link href="/acceso">Iniciar sesión <ArrowUpRight size={16} aria-hidden="true"/></Link>
  </header>
  <main>
   <section className="hero">
    <div>
     <p className="eyebrow">FINANZAS CON PROPÓSITO</p>
     <h1>Tu asistente financiero con IA, guiado por sabiduría.</h1>
     <p className="lead">Organiza tus movimientos, entiende tus decisiones y avanza con un plan claro. MAYORDOMO une claridad financiera, principios bíblicos y una experiencia simple para el día a día.</p>
     <div className="page-actions">
      {checkout?<Button asChild><a href={checkout} target="_blank" rel="noopener noreferrer">Comprar acceso <ArrowUpRight aria-hidden="true"/></a></Button>:<Button asChild><Link href="/acceso?modo=registro">Comenzar mi historia <ArrowUpRight aria-hidden="true"/></Link></Button>}
      <Button asChild variant="outline"><Link href="/acceso">Ya tengo acceso</Link></Button>
     </div>
     <p className="hint">Tu dinero tiene una historia. Vamos a entenderla juntos.</p>
    </div>
    <div className="purpose-art" aria-label="Vista previa de MAYORDOMO">
     <div className="phone-preview">
      <Brand compact/>
      <p>Disponible</p>
      <strong>$ 12,480.00</strong>
      <span>Tu dinero, una herramienta para el bien.</span>
      <div className="preview-grid">
       <article><BarChart3 aria-hidden="true"/><b>Organiza</b><small>tu dinero</small></article>
       <article><Leaf aria-hidden="true"/><b>Decide</b><small>con sabiduría</small></article>
       <article><Heart aria-hidden="true"/><b>Vive</b><small>con propósito</small></article>
      </div>
     </div>
    </div>
   </section>
   <section className="promise">
    <p className="eyebrow">LO QUE IMPORTA, EN ORDEN</p>
    <div className="three-columns">
     <div><span>01</span><h2>Entiende dónde estás.</h2><p>Reúne ingresos, gastos, metas y compromisos en un solo lugar.</p></div>
     <div><span>02</span><h2>Conversa con la IA.</h2><p>Pregunta por tus hábitos, riesgos y oportunidades con contexto financiero real.</p></div>
     <div><span>03</span><h2>Avanza con propósito.</h2><p>Conecta tus decisiones diarias con un plan responsable y sostenible.</p></div>
    </div>
   </section>
  </main>
  <footer className="public-footer">
   <Brand compact/>
   <p>Organización y educación financiera. Tus decisiones siempre te pertenecen.</p>
   <nav aria-label="Información"><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><Link href="/soporte">Soporte</Link></nav>
  </footer>
 </>;
}
