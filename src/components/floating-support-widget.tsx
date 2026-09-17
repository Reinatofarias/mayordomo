'use client';
import {useActionState,useEffect,useMemo,useRef,useState} from 'react';
import {X,ChevronDown,LifeBuoy} from 'lucide-react';
import {sendSupportChatMessage} from '@/app/(private)/ayuda/actions';
import {Button} from '@/components/ui/button';

const faqs=[
 {id:'access',question:'Meu acesso ou pagamento nao apareceu',answer:'Confira se voce entrou com o mesmo e-mail usado na Hotmart. Depois va em Perfil > Revisar acesso Hotmart. Se a compra foi feita com outro e-mail, envie uma mensagem com o e-mail usado na compra para revisao humana.'},
 {id:'import',question:'Como importar um extrato?',answer:'Va em Importar, envie um CSV ou XLSX, confira as colunas sugeridas, revise a previa e confirme somente quando datas, valores, moeda e categorias estiverem corretos. Nada vira movimento antes da confirmacao.'},
 {id:'currency',question:'Mudei moeda/idioma e nao entendi o efeito',answer:'A moeda principal passa a valer para novos movimentos, planos e importacoes. Registros antigos continuam na moeda em que foram criados. O idioma/formato muda datas, numeros e moeda; traducao completa da interface sera uma etapa separada de i18n.'},
 {id:'ai',question:'O que o MAYORDOMO IA pode responder?',answer:'Ele usa os dados registrados para explicar gastos, categorias, tendencias e proximos passos prudentes. Ele nao move dinheiro, nao acessa banco e nao substitui aconselhamento financeiro, legal, fiscal ou de investimento.'},
 {id:'privacy',question:'Meus dados financeiros estao seguros?',answer:'Use o app para registrar organizacao financeira, mas nunca envie senhas, tokens, codigos de banco ou dados completos de cartao. O suporte tambem nunca deve pedir essas informacoes.'}
] as const;

type SupportMessage={id:string;sender:string;message:string;created_at:string};

export function FloatingSupportWidget({messages}:{messages:SupportMessage[]}){
 const [open,setOpen]=useState(false),[compose,setCompose]=useState(false),[activeFaq,setActiveFaq]=useState<string>(faqs[0].id);
 const [state,action,pending]=useActionState(sendSupportChatMessage,{});const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(!state.message)return;formRef.current?.reset();const timer=window.setTimeout(()=>{setCompose(false);setOpen(true);},0);return ()=>window.clearTimeout(timer);},[state.message]);
 const selected=useMemo(()=>faqs.find(item=>item.id===activeFaq)??faqs[0],[activeFaq]);
 return <aside className="support-widget" aria-label="Chat de suporte">
  {open&&<section className="support-widget-panel">
   <header><div><span>Soporte MAYORDOMO</span><strong>Como podemos ajudar?</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label="Minimizar suporte"><X size={18}/></button></header>
   <div className="support-widget-body">
    <div className="support-faqs" aria-label="Dudas frecuentes">{faqs.map(item=><button key={item.id} type="button" data-active={item.id===activeFaq||undefined} onClick={()=>{setActiveFaq(item.id);setCompose(false);}}><span>{item.question}</span><ChevronDown size={15}/></button>)}</div>
    <article className="support-faq-answer"><strong>{selected.question}</strong><p>{selected.answer}</p></article>
    {messages.length>0&&<details className="support-widget-history"><summary>Ver conversa recente</summary><div className="support-thread compact">{messages.slice(-5).map(message=><article key={message.id} data-sender={message.sender}><strong>{message.sender==='user'?'Voce':message.sender==='admin'?'Suporte humano':'MAYORDOMO suporte'}</strong><p>{message.message}</p></article>)}</div></details>}
    {!compose?<div className="support-widget-actions"><Button type="button" onClick={()=>setCompose(true)}>Ainda preciso de ajuda</Button><p>Antes de chegar no humano, o Gemini tenta responder. Casos de pagamento, erro ou pedido de humano ficam marcados para revisao.</p></div>:<form ref={formRef} action={action} className="support-widget-form"><label htmlFor="floating-support-message">Mensagem para suporte</label><textarea id="floating-support-message" name="message" rows={4} required minLength={2} maxLength={3000} placeholder="Descreva o que aconteceu. Nao envie senhas, cartoes ou codigos."/>{state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}<div><Button disabled={pending}>{pending?'Enviando...':'Enviar'}</Button><Button type="button" variant="outline" onClick={()=>setCompose(false)}>Voltar às dúvidas</Button></div></form>}
   </div>
  </section>}
  <button className="support-widget-trigger" type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open}><LifeBuoy size={21}/><span>{open?'Minimizar':'Ajuda'}</span></button>
 </aside>;
}