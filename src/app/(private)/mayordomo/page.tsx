import {randomUUID} from 'node:crypto';
import {getContext} from '@/data/finance';
import {aiEnabled} from '@/ai/financial-steward';
import {Chat} from '@/components/chat';
export default async function Mayordomo(){await getContext();return <><header className="page-heading"><p className="eyebrow">CLARIDAD PARA TU CAMINO</p><h1>Hablemos de tu dinero.</h1><p>Sin juicios. Con información y propósito.</p></header>{aiEnabled()?<Chat conversationId={randomUUID()}/>:<section className="empty"><h2>MAYORDOMO no está disponible temporalmente.</h2><p>Puedes seguir registrando tus movimientos y organizando tu plan. Vuelve a intentar más tarde.</p></section>}</>;}
