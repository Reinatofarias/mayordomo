'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
export function Chat({conversationId}:{conversationId:string}){
 const [messages,setMessages]=useState<{role:'user'|'assistant';text:string}[]>([]),[pending,setPending]=useState(false),[error,setError]=useState('');
 async function send(event:React.SubmitEvent<HTMLFormElement>){
 event.preventDefault();if(pending)return;const form=event.currentTarget;const data=new FormData(form);const message=String(data.get('message')??'').trim();if(!message)return;
 setPending(true);setError('');setMessages(old=>[...old,{role:'user',text:message},{role:'assistant',text:''}]);
 try{
 const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,conversationId,consent:data.get('consent')==='on'})});
 if(!response.ok||!response.body)throw new Error();
 const reader=response.body.getReader(),decoder=new TextDecoder();let text='';
 while(true){const {done,value}=await reader.read();if(done)break;text+=decoder.decode(value,{stream:true});const current=text;setMessages(old=>[...old.slice(0,-1),{role:'assistant',text:current}]);}
 form.reset();
 }catch{setError('No pudimos completar la respuesta. Inténtalo nuevamente.');}finally{setPending(false);}
 }
 return <><div aria-live="polite" aria-busy={pending}>{messages.map((m,i)=><div key={i} className="chat-message" data-role={m.role}><strong>{m.role==='user'?'Tú':'MAYORDOMO'}</strong><p>{m.text||'Consultando tu información…'}</p></div>)}</div><form onSubmit={send} className="form-stack"><label className="consent"><input type="checkbox" name="consent" required/>Acepto que mis mensajes y datos financieros necesarios sean procesados por el proveedor de IA configurado para responderme.</label><label htmlFor="message">¿Qué te gustaría entender de tu dinero?</label><textarea id="message" name="message" maxLength={4000} required placeholder="¿Cómo van mis gastos este mes?"/>{error&&<p role="alert">{error}</p>}<Button disabled={pending}>{pending?'Consultando…':'Conversar con MAYORDOMO'}</Button></form><p className="hint">Información educativa. Revisa los datos y decide con libertad. Las propuestas se confirman en Plan.</p></>;
}
