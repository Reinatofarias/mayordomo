'use client';
import {useActionState,useEffect,useRef} from 'react';
import {sendSupportChatMessage} from '@/app/(private)/ayuda/actions';
import {Button} from '@/components/ui/button';

export function SupportChat({messages}:{messages:{id:string;sender:string;message:string;created_at:string}[]}){
 const [state,action,pending]=useActionState(sendSupportChatMessage,{});const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(state.message)formRef.current?.reset();},[state.message]);
 return <section className="support-chat"><div className="support-thread" aria-live="polite">{messages.length?messages.map(m=><article key={m.id} data-sender={m.sender}><strong>{m.sender==='user'?'Tu':m.sender==='admin'?'Soporte humano':'MAYORDOMO soporte'}</strong><p>{m.message}</p><small>{new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'}).format(new Date(m.created_at))}</small></article>):<div className="empty"><h2>Como podemos ayudarte?</h2><p>Primero respondera MAYORDOMO con orientacion inicial. Si hace falta un humano, la conversacion quedara marcada para revision.</p></div>}</div><form ref={formRef} action={action} className="chat-form"><label className="sr-only" htmlFor="support-message">Mensaje de soporte</label><textarea id="support-message" name="message" rows={3} required minLength={2} maxLength={3000} placeholder="Cuentanos que ocurrio. No compartas contrasenas ni datos de tarjetas."/>{state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}<Button disabled={pending}>{pending?'Enviando...':'Enviar mensaje'}</Button></form></section>;
}