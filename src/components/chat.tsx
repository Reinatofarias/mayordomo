'use client';
import {useState,type FormEvent} from 'react';
import {languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';

const CHAT_CLIENT_TIMEOUT_MS=35_000;

const copy={
 es:{suggestions:['¿Cómo van mis gastos este mes?','¿Qué categoría pesa más en mi presupuesto?','Dame tres acciones prudentes para esta semana.'],aria:'Conversación con MAYORDOMO',eyebrow:'MAYORDOMO IA',title:'Conversa con tus datos financieros',analyzing:'Analizando',ready:'Listo',emptyTitle:'Empieza con una pregunta concreta.',emptyText:'Puedo leer tus movimientos, detectar categorías fuertes y proponer próximos pasos educativos sin guardar cambios por ti.',you:'Tú',typing:'Escribiendo',consent:'Acepto que mis mensajes y datos financieros necesarios sean procesados por el proveedor de IA configurado para responderme.',label:'¿Qué te gustaría entender de tu dinero?',placeholder:'¿Qué te gustaría entender de tu dinero?',sending:'Consultando…',send:'Enviar',timeout:'La respuesta tardó demasiado. Inténtalo nuevamente.',error:'No pudimos completar la respuesta. Inténtalo nuevamente.',hint:'Información educativa. Revisa los datos y decide con libertad. Las propuestas se confirman en Plan.'},
 pt:{suggestions:['Como estão meus gastos este mês?','Qual categoria pesa mais no meu orçamento?','Dê três ações prudentes para esta semana.'],aria:'Conversa com MAYORDOMO',eyebrow:'MAYORDOMO IA',title:'Converse com seus dados financeiros',analyzing:'Analisando',ready:'Pronto',emptyTitle:'Comece com uma pergunta concreta.',emptyText:'Posso ler seus movimentos, detectar categorias fortes e propor próximos passos educativos sem salvar mudanças por você.',you:'Você',typing:'Escrevendo',consent:'Aceito que minhas mensagens e dados financeiros necessários sejam processados pelo provedor de IA configurado para me responder.',label:'O que você gostaria de entender sobre seu dinheiro?',placeholder:'O que você gostaria de entender sobre seu dinheiro?',sending:'Consultando…',send:'Enviar',timeout:'A resposta demorou demais. Tente novamente.',error:'Não conseguimos completar a resposta. Tente novamente.',hint:'Informação educativa. Revise os dados e decida com liberdade. As propostas são confirmadas em Plano.'}
};

export function Chat({conversationId,locale='es-MX'}:{conversationId:string;locale?:string}){
 const t=copy[languageFromLocale(locale)];
 const [messages,setMessages]=useState<{role:'user'|'assistant';text:string}[]>([]),[pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[consent,setConsent]=useState(false);
 async function send(event:FormEvent<HTMLFormElement>){
 event.preventDefault();if(pending)return;const text=message.trim();if(!text)return;
 setPending(true);setError('');setMessages(old=>[...old,{role:'user',text},{role:'assistant',text:''}]);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),CHAT_CLIENT_TIMEOUT_MS);
 try{
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,conversationId,consent}),signal:controller.signal});
 if(!response.ok||!response.body)throw new Error();
 const reader=response.body.getReader(),decoder=new TextDecoder();let answer='';
 while(true){const {done,value}=await reader.read();if(done)break;answer+=decoder.decode(value,{stream:true});const current=answer;setMessages(old=>[...old.slice(0,-1),{role:'assistant',text:current}]);}
 setMessage('');
 }catch(error){setMessages(old=>old.at(-1)?.role==='assistant'&&old.at(-1)?.text===''?old.slice(0,-1):old);setError(error instanceof DOMException&&error.name==='AbortError'?t.timeout:t.error);}finally{clearTimeout(timeout);setPending(false);}
 }
 return <section className="chat-shell" aria-label={t.aria}>
  <div className="chat-panel">
   <div className="chat-panel-header"><div><span className="eyebrow">{t.eyebrow}</span><h2>{t.title}</h2></div><span className="chat-status" data-active={pending}>{pending?t.analyzing:t.ready}</span></div>
   <div className="chat-window" aria-live="polite" aria-busy={pending}>
    {messages.length===0&&<div className="chat-empty"><strong>{t.emptyTitle}</strong><p>{t.emptyText}</p></div>}
    {messages.map((m,i)=><article key={i} className="chat-message" data-role={m.role}><div className="chat-avatar">{m.role==='user'?t.you.charAt(0):'M'}</div><div className="chat-bubble"><strong>{m.role==='user'?t.you:'MAYORDOMO'}</strong>{m.text?<p>{m.text}</p>:<div className="typing-indicator" aria-label={t.typing}><span>{t.typing}</span><i aria-hidden="true"/><i aria-hidden="true"/><i aria-hidden="true"/></div>}</div></article>)}
   </div>
   <div className="chat-suggestions" aria-label="Sugestões">{t.suggestions.map(item=><button key={item} type="button" onClick={()=>setMessage(item)} disabled={pending}>{item}</button>)}</div>
   <form onSubmit={send} className="chat-form">
    <label className="chat-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/>{t.consent}</label>
    <label className="sr-only" htmlFor="message">{t.label}</label>
    <div className="chat-compose"><textarea id="message" name="message" value={message} onChange={event=>setMessage(event.target.value)} maxLength={4000} required placeholder={t.placeholder} rows={3}/><Button disabled={pending||!consent||!message.trim()}>{pending?t.sending:t.send}</Button></div>
    {error&&<p role="alert" className="form-error">{error}</p>}
   </form>
  </div>
  <p className="hint">{t.hint}</p>
 </section>;
}