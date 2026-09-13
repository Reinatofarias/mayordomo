import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {getContext} from '@/data/finance';
import {aiEnabled} from '@/ai/financial-steward';
import {Chat} from '@/components/chat';
import {Button} from '@/components/ui/button';

export default async function Mayordomo(){
 await getContext();
 return <>
  <header className="page-heading"><p className="eyebrow">CLARIDAD PARA TU CAMINO</p><h1>Hablemos de tu dinero.</h1><p>Sin juicios. Con información y propósito.</p></header>
  {aiEnabled()?<Chat conversationId={randomUUID()}/>:<section className="empty"><h2>MAYORDOMO no está disponible temporalmente.</h2><p>La plataforma sigue lista para registrar movimientos, organizar tu plan y preparar tus datos. Cuando la IA esté habilitada, podrás conversar aquí con tu información financiera registrada.</p><div className="page-actions"><Button asChild><Link href="/movimientos/nuevo">Registrar movimiento</Link></Button><Button asChild variant="outline"><Link href="/plan">Revisar mi plan</Link></Button></div></section>}
 </>;
}
