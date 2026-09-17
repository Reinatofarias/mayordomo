import {getContext} from '@/data/finance';
import {languageFromLocale} from '@/i18n/app';
import {SupportChat} from '@/components/support-chat';
import Link from 'next/link';

const copy={
 es:{eyebrow:'AYUDA Y SOPORTE',title:'Chat de soporte',intro:'Primero intentamos ayudarte con MAYORDOMO. Si hace falta una persona, el caso queda marcado para revisión humana.',hint:'Para asuntos de pago, incluye el correo usado en Hotmart. Nunca compartas contraseñas ni datos de tarjeta.',back:'Volver al perfil ->'},
 pt:{eyebrow:'AJUDA E SUPORTE',title:'Chat de suporte',intro:'Primeiro tentamos ajudar com MAYORDOMO. Se precisar de uma pessoa, o caso fica marcado para revisão humana.',hint:'Para assuntos de pagamento, inclua o e-mail usado na Hotmart. Nunca compartilhe senhas nem dados de cartão.',back:'Voltar ao perfil ->'}
};

export default async function HelpPage(){
 const c=await getContext(false);const t=copy[languageFromLocale(c.profile.locale)];
 const {data:request}=await c.db.from('support_requests').select('id').eq('user_id',c.user.id).eq('status','OPEN').ilike('subject','Chat de soporte%').order('created_at',{ascending:false}).limit(1).maybeSingle();
 const {data:messages}=request?await c.db.from('support_messages').select('id,sender,message,created_at').eq('user_id',c.user.id).eq('request_id',request.id).order('created_at',{ascending:true}):{data:[]};
 return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header><SupportChat messages={messages??[]} locale={c.profile.locale}/><p className="hint">{t.hint}</p><Link href="/perfil">{t.back}</Link></>;
}