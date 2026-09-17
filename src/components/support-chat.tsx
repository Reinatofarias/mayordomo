'use client';
import {useActionState,useEffect,useRef} from 'react';
import {sendSupportChatMessage} from '@/app/(private)/ayuda/actions';
import {formatDateTime,languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';

const copy={
 es:{you:'Tú',admin:'Soporte humano',bot:'MAYORDOMO soporte',emptyTitle:'¿Cómo podemos ayudarte?',emptyText:'Primero responderá MAYORDOMO con orientación inicial. Si hace falta un humano, la conversación quedará marcada para revisión.',label:'Mensaje de soporte',placeholder:'Cuéntanos qué ocurrió. No compartas contraseñas ni datos de tarjetas.',sending:'Enviando...',send:'Enviar mensaje'},
 pt:{you:'Você',admin:'Suporte humano',bot:'MAYORDOMO suporte',emptyTitle:'Como podemos ajudar?',emptyText:'Primeiro MAYORDOMO responderá com orientação inicial. Se precisar de um humano, a conversa ficará marcada para revisão.',label:'Mensagem de suporte',placeholder:'Conte o que aconteceu. Não compartilhe senhas nem dados de cartões.',sending:'Enviando...',send:'Enviar mensagem'}
};

export function SupportChat({messages,locale='es-MX'}:{messages:{id:string;sender:string;message:string;created_at:string}[];locale?:string}){
 const [state,action,pending]=useActionState(sendSupportChatMessage,{});const formRef=useRef<HTMLFormElement>(null);const t=copy[languageFromLocale(locale)];
 useEffect(()=>{if(state.message)formRef.current?.reset();},[state.message]);
 return <section className="support-chat"><div className="support-thread" aria-live="polite">{messages.length?messages.map(m=><article key={m.id} data-sender={m.sender}><strong>{m.sender==='user'?t.you:m.sender==='admin'?t.admin:t.bot}</strong><p>{m.message}</p><small>{formatDateTime(m.created_at,locale)}</small></article>):<div className="empty"><h2>{t.emptyTitle}</h2><p>{t.emptyText}</p></div>}</div><form ref={formRef} action={action} className="chat-form"><label className="sr-only" htmlFor="support-message">{t.label}</label><textarea id="support-message" name="message" rows={3} required minLength={2} maxLength={3000} placeholder={t.placeholder}/>{state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}<Button disabled={pending}>{pending?t.sending:t.send}</Button></form></section>;
}