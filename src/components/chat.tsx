'use client';
import {useState,type FormEvent} from 'react';
import {Button} from '@/components/ui/button';

const suggestions=[
 '¿Cómo van mis gastos este mes?',
 '¿Qué categoría pesa más en mi presupuesto?',
 'Dame tres acciones prudentes para esta semana.'
];

export function Chat({conversationId}:{conversationId:string}){
 const [messages,setMessages]=useState<{role:'user'|'assistant';text:string}[]>([]),[pending,setPending]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[consent,setConsent]=useState(false);
 async function send(event:FormEvent<HTMLFormElement>){
 event.preventDefault();if(pending)return;const text=message.trim();if(!text)return;
 setPending(true);setError('');setMessages(old=>[...old,{role:'user',text},{role:'assistant',text:''}]);
 try{
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,conversationId,consent})});
 if(!response.ok||!response.body)throw new Error();
 const reader=response.body.getReader(),decoder=new TextDecoder();let answer='';
 while(true){const {done,value}=await reader.read();if(done)break;answer+=decoder.decode(value,{stream:true});const current=answer;setMessages(old=>[...old.slice(0,-1),{role:'assistant',text:current}]);}
 setMessage('');
 }catch{setMessages(old=>old.at(-1)?.role==='assistant'&&old.at(-1)?.text===''?old.slice(0,-1):old);setError('No pudimos completar la respuesta. Inténtalo nuevamente.');}finally{setPending(false);}
 }
 return <section className="chat-shell" aria-label="Conversación con MAYORDOMO">
  <div className="chat-panel">
   <div className="chat-panel-header">
    <div>
     <span className="eyebrow">MAYORDOMO IA</span>
     <h2>Conversa con tus datos financieros</h2>
    </div>
    <span className="chat-status" data-active={pending}>{pending?'Analizando':'Listo'}</span>
   </div>
   <div className="chat-window" aria-live="polite" aria-busy={pending}>
    {messages.length===0&&<div className="chat-empty"><strong>Empieza con una pregunta concreta.</strong><p>Puedo leer tus movimientos, detectar categorías fuertes y proponer próximos pasos educativos sin guardar cambios por ti.</p></div>}
    {messages.map((m,i)=><article key={i} className="chat-message" data-role={m.role}><div className="chat-avatar">{m.role==='user'?'Tú':'M'}</div><div className="chat-bubble"><strong>{m.role==='user'?'Tú':'MAYORDOMO'}</strong><p>{m.text||'Consultando tu información…'}</p></div></article>)}
   </div>
   <div className="chat-suggestions" aria-label="Preguntas sugeridas">{suggestions.map(item=><button key={item} type="button" onClick={()=>setMessage(item)} disabled={pending}>{item}</button>)}</div>
   <form onSubmit={send} className="chat-form">
    <label className="chat-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/>Acepto que mis mensajes y datos financieros necesarios sean procesados por el proveedor de IA configurado para responderme.</label>
    <label className="sr-only" htmlFor="message">¿Qué te gustaría entender de tu dinero?</label>
    <div className="chat-compose">
     <textarea id="message" name="message" value={message} onChange={event=>setMessage(event.target.value)} maxLength={4000} required placeholder="¿Qué te gustaría entender de tu dinero?" rows={3}/>
     <Button disabled={pending||!consent||!message.trim()}>{pending?'Consultando…':'Enviar'}</Button>
    </div>
    {error&&<p role="alert" className="form-error">{error}</p>}
   </form>
  </div>
  <p className="hint">Información educativa. Revisa los datos y decide con libertad. Las propuestas se confirman en Plan.</p>
 </section>;
}
