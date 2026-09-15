import {notFound} from 'next/navigation';
import {requireUser} from '@/data/supabase';
import {adminClient} from '@/data/admin';
import {isSupportAdmin,supportAdminEmails} from '@/data/support';
import {replySupportRequest,resolveSupportRequest} from '@/app/(private)/admin/soporte/actions';
import {Button} from '@/components/ui/button';

type SupportMessage={id:string;user_id:string;request_id:string;sender:string;message:string;created_at:string};

export default async function AdminSupportPage(){
 const {user}=await requireUser();
 if(!isSupportAdmin(user.email))notFound();
 const admin=adminClient();
 const {data:requests}=await admin.from('support_requests').select('id,user_id,subject,message,status,created_at,updated_at').order('updated_at',{ascending:false}).limit(50);
 const ids=(requests??[]).map(r=>r.id);
 const {data:messages}=ids.length?await admin.from('support_messages').select('id,user_id,request_id,sender,message,created_at').in('request_id',ids).order('created_at',{ascending:true}):{data:[]};
 const byRequest=new Map<string,SupportMessage[]>();
 for(const message of (messages??[]) as SupportMessage[]){const list=byRequest.get(message.request_id)??[];list.push(message);byRequest.set(message.request_id,list);}
 return <><header className="page-heading"><p className="eyebrow">OPERACION</p><h1>Soporte humano</h1><p>Administradores autorizados: {supportAdminEmails().join(', ')}.</p></header><section className="admin-support-list">{requests?.length?requests.map(request=><article key={request.id} className="admin-support-card"><div><p className="eyebrow">{request.status}</p><h2>{request.subject}</h2><p>Usuario: {request.user_id}</p><small>Creado: {new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(request.created_at))}</small></div><div className="support-thread admin-thread">{(byRequest.get(request.id)??[]).map(message=><article key={message.id} data-sender={message.sender}><strong>{message.sender}</strong><p>{message.message}</p><small>{new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'}).format(new Date(message.created_at))}</small></article>)}</div><form action={replySupportRequest} className="form-stack"><input type="hidden" name="requestId" value={request.id}/><input type="hidden" name="userId" value={request.user_id}/><label htmlFor={'reply-'+request.id}>Responder</label><textarea id={'reply-'+request.id} name="message" required minLength={2} maxLength={3000} placeholder="Respuesta para el usuario"/><Button>Enviar respuesta</Button></form><form action={resolveSupportRequest}><input type="hidden" name="requestId" value={request.id}/><input type="hidden" name="userId" value={request.user_id}/><Button variant="outline">Marcar resuelto</Button></form></article>):<section className="empty"><h2>No hay solicitudes.</h2><p>Cuando un usuario pida ayuda humana, aparecera aqui.</p></section>}</section></>;
}