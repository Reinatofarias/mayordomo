import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import {getContext} from '@/data/finance';
import {aiEnabled} from '@/ai/financial-steward';
import {languageFromLocale} from '@/i18n/app';
import {Chat} from '@/components/chat';
import {Button} from '@/components/ui/button';

const copy={
 es:{eyebrow:'CLARIDAD PARA TU CAMINO',title:'Hablemos de tu dinero.',intro:'Sin juicios. Con información y propósito.',emptyTitle:'MAYORDOMO no está disponible temporalmente.',emptyText:'La plataforma sigue lista para registrar movimientos, organizar tu plan y preparar tus datos. Cuando la IA esté habilitada, podrás conversar aquí con tu información financiera registrada.',movement:'Registrar movimiento',plan:'Revisar mi plan'},
 pt:{eyebrow:'CLAREZA PARA O SEU CAMINHO',title:'Vamos falar sobre seu dinheiro.',intro:'Sem julgamentos. Com informação e propósito.',emptyTitle:'MAYORDOMO não está disponível temporariamente.',emptyText:'A plataforma continua pronta para registrar movimentos, organizar seu plano e preparar seus dados. Quando a IA estiver habilitada, você poderá conversar aqui com suas informações financeiras registradas.',movement:'Registrar movimento',plan:'Revisar meu plano'}
};

export default async function Mayordomo(){
 const c=await getContext();const t=copy[languageFromLocale(c.profile.locale)];
 return <>
  <header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>
  {aiEnabled()?<Chat conversationId={randomUUID()} locale={c.profile.locale}/>:<section className="empty"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p><div className="page-actions"><Button asChild><Link href="/movimientos/nuevo">{t.movement}</Link></Button><Button asChild variant="outline"><Link href="/plan">{t.plan}</Link></Button></div></section>}
 </>;
}