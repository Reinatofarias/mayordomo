import {getContext} from '@/data/finance';
import {SupportChat} from '@/components/support-chat';
import Link from 'next/link';

export default async function HelpPage(){
 const c=await getContext(false);
 const {data:request}=await c.db.from('support_requests').select('id').eq('user_id',c.user.id).eq('status','OPEN').ilike('subject','Chat de soporte%').order('created_at',{ascending:false}).limit(1).maybeSingle();
 const {data:messages}=request?await c.db.from('support_messages').select('id,sender,message,created_at').eq('user_id',c.user.id).eq('request_id',request.id).order('created_at',{ascending:true}):{data:[]};
 return <><header className="page-heading"><p className="eyebrow">AYUDA Y SOPORTE</p><h1>Chat de soporte</h1><p>Primero intentamos ayudarte con MAYORDOMO. Si hace falta una persona, el caso queda marcado para revision humana.</p></header><SupportChat messages={messages??[]}/><p className="hint">Para asuntos de pago, incluye el correo usado en Hotmart. Nunca compartas contrasenas ni datos de tarjeta.</p><Link href="/perfil">Volver al perfil -&gt;</Link></>;
}