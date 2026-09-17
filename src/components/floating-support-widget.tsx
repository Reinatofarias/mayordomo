'use client';

import {useActionState,useEffect,useMemo,useRef,useState} from 'react';
import {X,ChevronDown,LifeBuoy} from 'lucide-react';
import {sendSupportChatMessage} from '@/app/(private)/ayuda/actions';
import {languageFromLocale} from '@/i18n/app';
import {Button} from '@/components/ui/button';

const faqSets={
 pt:[
  {id:'access',question:'Meu acesso ou pagamento nao apareceu',answer:'Confira se voce entrou com o mesmo e-mail usado na Hotmart. Depois va em Perfil > Revisar acesso Hotmart. Se a compra foi feita com outro e-mail, envie uma mensagem com o e-mail usado na compra para revisao humana.'},
  {id:'import',question:'Como importar um extrato?',answer:'Va em Importar, envie um CSV ou XLSX, confira as colunas sugeridas, revise a previa e confirme somente quando datas, valores, moeda e categorias estiverem corretos. Nada vira movimento antes da confirmacao.'},
  {id:'currency',question:'Mudei moeda/idioma e nao entendi o efeito',answer:'A moeda principal passa a valer para novos movimentos, planos e importacoes. Registros antigos continuam na moeda em que foram criados. O idioma/formato muda datas, numeros e moeda. Textos principais aparecem em portugues quando disponiveis.'},
  {id:'ai',question:'O que o MAYORDOMO IA pode responder?',answer:'Ele usa os dados registrados para explicar gastos, categorias, tendencias e proximos passos prudentes. Ele nao move dinheiro, nao acessa banco e nao substitui aconselhamento financeiro, legal, fiscal ou de investimento.'},
  {id:'privacy',question:'Meus dados financeiros estao seguros?',answer:'Use o app para registrar organizacao financeira, mas nunca envie senhas, tokens, codigos de banco ou dados completos de cartao. O suporte tambem nunca deve pedir essas informacoes.'}
 ],
 es:[
  {id:'access',question:'Mi acceso o pago no aparece',answer:'Confirma que entraste con el mismo correo usado en Hotmart. Luego ve a Perfil > Revisar acceso Hotmart. Si compraste con otro correo, envia el correo de compra para revision humana.'},
  {id:'import',question:'Como importo un extracto?',answer:'Ve a Importar, envia un CSV o XLSX, revisa columnas sugeridas, verifica la previa y confirma solo cuando fechas, valores, moneda y categorias esten correctos.'},
  {id:'currency',question:'Cambie moneda/idioma y no veo el efecto',answer:'La moneda principal aplica para nuevos movimientos, planes e importaciones. Los registros anteriores conservan la moneda original. El idioma/formato ajusta fechas, numeros y moneda; textos principales se muestran en tu idioma cuando esten disponibles.'},
  {id:'ai',question:'Que puede responder MAYORDOMO IA?',answer:'Usa tus datos registrados para explicar gastos, categorias, tendencias y proximos pasos prudentes. No mueve dinero, no accede a bancos y no reemplaza asesoria financiera, legal, fiscal o de inversion.'},
  {id:'privacy',question:'Mis datos financieros estan seguros?',answer:'Usa la app para organizar tus finanzas, pero nunca envies contrasenas, tokens, codigos bancarios ni datos completos de tarjeta. Soporte tampoco debe pedirlos.'}
 ]
} as const;

const copy={pt:{aria:'Chat de suporte',title:'Suporte MAYORDOMO',subtitle:'Como podemos ajudar?',faq:'Duvidas frequentes',history:'Ver conversa recente',you:'Voce',human:'Suporte humano',bot:'MAYORDOMO suporte',need:'Ainda preciso de ajuda',barrier:'Antes de chegar no humano, o Gemini tenta responder. Casos de pagamento, erro ou pedido de humano ficam marcados para revisao.',label:'Mensagem para suporte',placeholder:'Descreva o que aconteceu. Nao envie senhas, cartoes ou codigos.',sending:'Enviando...',send:'Enviar',back:'Voltar as duvidas',minimize:'Minimizar',help:'Ajuda'},es:{aria:'Chat de soporte',title:'Soporte MAYORDOMO',subtitle:'Como podemos ayudarte?',faq:'Dudas frecuentes',history:'Ver conversacion reciente',you:'Tu',human:'Soporte humano',bot:'MAYORDOMO soporte',need:'Aun necesito ayuda',barrier:'Antes de llegar a un humano, Gemini intenta responder. Casos de pago, error o pedido humano quedan marcados para revision.',label:'Mensaje para soporte',placeholder:'Describe que ocurrio. No envies contrasenas, tarjetas ni codigos.',sending:'Enviando...',send:'Enviar',back:'Volver a dudas',minimize:'Minimizar',help:'Ayuda'}};

type SupportMessage={id:string;sender:string;message:string;created_at:string};

export function FloatingSupportWidget({messages,locale='es-MX'}:{messages:SupportMessage[];locale?:string}){
 const lang=languageFromLocale(locale);const faqs=faqSets[lang];const t=copy[lang];
 const [open,setOpen]=useState(false),[compose,setCompose]=useState(false),[activeFaq,setActiveFaq]=useState<string>('access');
 const [state,action,pending]=useActionState(sendSupportChatMessage,{});const formRef=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(!state.message)return;formRef.current?.reset();const timer=window.setTimeout(()=>{setCompose(false);setOpen(true);},0);return ()=>window.clearTimeout(timer);},[state.message]);
 const selected=useMemo(()=>faqs.find(item=>item.id===activeFaq)??faqs[0],[activeFaq,faqs]);
 return <aside className="support-widget" aria-label={t.aria}>{open&&<section className="support-widget-panel"><header><div><span>{t.title}</span><strong>{t.subtitle}</strong></div><button type="button" onClick={()=>setOpen(false)} aria-label={t.minimize}><X size={18}/></button></header><div className="support-widget-body"><div className="support-faqs" aria-label={t.faq}>{faqs.map(item=><button key={item.id} type="button" data-active={item.id===selected.id||undefined} onClick={()=>{setActiveFaq(item.id);setCompose(false);}}><span>{item.question}</span><ChevronDown size={15}/></button>)}</div><article className="support-faq-answer"><strong>{selected.question}</strong><p>{selected.answer}</p></article>{messages.length>0&&<details className="support-widget-history"><summary>{t.history}</summary><div className="support-thread compact">{messages.slice(-5).map(message=><article key={message.id} data-sender={message.sender}><strong>{message.sender==='user'?t.you:message.sender==='admin'?t.human:t.bot}</strong><p>{message.message}</p></article>)}</div></details>}{!compose?<div className="support-widget-actions"><Button type="button" onClick={()=>setCompose(true)}>{t.need}</Button><p>{t.barrier}</p></div>:<form ref={formRef} action={action} className="support-widget-form"><input type="hidden" name="humanRequested" value="true"/><label htmlFor="floating-support-message">{t.label}</label><textarea id="floating-support-message" name="message" rows={4} required minLength={2} maxLength={3000} placeholder={t.placeholder}/>{state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}<div><Button disabled={pending}>{pending?t.sending:t.send}</Button><Button type="button" variant="outline" onClick={()=>setCompose(false)}>{t.back}</Button></div></form>}</div></section>}<button className="support-widget-trigger" type="button" onClick={()=>setOpen(value=>!value)} aria-expanded={open}><LifeBuoy size={21}/><span>{open?t.minimize:t.help}</span></button></aside>;
}