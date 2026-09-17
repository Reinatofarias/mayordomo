'use client';
import {useActionState,useEffect,useMemo,useState} from 'react';
import {completeOnboarding} from '@/app/bienvenida/actions';
import {countries,countryFromLocale,currencyOptions,localeOptions,objectives} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {PrincipleCard} from '@/components/principle-card';

const totalSteps=7;
const currencies=currencyOptions();
const objectiveGuidance:Record<string,{reference:string;principle:string;application:string}>= {
 'Salir de deudas':{reference:'Proverbios 22:7',principle:'La deuda puede limitar la libertad de decision.',application:'Vamos a mirar tus compromisos con verdad y esperanza, sin verguenza.'},
 'Gastar con mas prudencia':{reference:'Proverbios 22:3',principle:'La prudencia reconoce los riesgos.',application:'Antes de asumir nuevos gastos, revisa lo que ya esta comprometido.'},
 'Crear una reserva':{reference:'Proverbios 21:20',principle:'La sabiduria valora conservar recursos.',application:'Separar una reserva pequena ya es un acto de mayordomia.'},
 'Organizar mi familia':{reference:'Lucas 14:28',principle:'Antes de construir, conviene calcular el costo.',application:'Un plan claro ayuda a conversar y decidir con mas paz.'},
 'Ser mas fiel en la administracion':{reference:'1 Pedro 4:10',principle:'Administrar los recursos puede servir a otros.',application:'La fidelidad tambien se practica en decisiones pequenas.'},
 'Administrar mejor mi dinero':{reference:'Proverbios 4:7',principle:'Buscar sabiduria ayuda a tomar decisiones responsables.',application:'La claridad viene antes de cambiar habitos.'},
 'Entender donde estoy perdiendo dinero':{reference:'Lucas 16:10',principle:'La fidelidad se practica tambien en lo pequeno.',application:'Registrar movimientos revela patrones que antes estaban ocultos.'},
 'Comprar algo importante':{reference:'Lucas 14:28',principle:'Antes de construir, conviene calcular el costo.',application:'Comparar el objetivo con tus recursos protege tu decision.'},
 'Ahorrar':{reference:'Proverbios 21:20',principle:'La sabiduria valora conservar recursos.',application:'Considera una reserva segun tus posibilidades actuales.'},
 'Organizar mis gastos':{reference:'Proverbios 22:3',principle:'La prudencia reconoce los riesgos.',application:'Ordenar gastos te ayuda a decidir con intencion.'}
};

function safeAmount(value:string){return value.trim()?value:'0';}

export function Onboarding(){
 const initial=countries[0];
 const [step,setStep]=useState(1),[country,setCountry]=useState<string>(initial.code),[currency,setCurrency]=useState<string>(initial.currency),[locale,setLocale]=useState<string>(initial.locale),[timezone,setTimezone]=useState<string>(initial.timezone),[name,setName]=useState(''),[income,setIncome]=useState(''),[fixed,setFixed]=useState(''),[debt,setDebt]=useState(''),[reserve,setReserve]=useState(''),[objective,setObjective]=useState<(typeof objectives)[number]>(objectives[0]),[start,setStart]=useState<'manual'|'import'>('manual'),[localError,setLocalError]=useState('');
 const [state,action,pending]=useActionState(completeOnboarding,{});
 const selectedCountry=useMemo(()=>countries.find(c=>c.code===country)??countryFromLocale(locale),[country,locale]);
 const guidance=objectiveGuidance[objective]??objectiveGuidance['Administrar mejor mi dinero'];
 const progress=Math.round(step/totalSteps*100);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   const detectedLocale=navigator.languages?.[0]??navigator.language;
   if(detectedLocale){const detectedCountry=countryFromLocale(detectedLocale);setLocale(detectedLocale);setCountry(detectedCountry.code);setCurrency(detectedCountry.currency);}
   const detectedTimeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
   if(detectedTimeZone)setTimezone(detectedTimeZone);
  },0);
  return ()=>window.clearTimeout(timer);
 },[]);
 function selectCountry(value:string){const next=countries.find(c=>c.code===value)??initial;setCountry(next.code);setCurrency(next.currency);setLocale(next.locale);setTimezone(next.timezone);}
 function selectLocale(value:string){setLocale(value);const next=countryFromLocale(value);setCountry(next.code);setCurrency(next.currency);}
 function next(){
  if(step===2&&!name.trim()){setLocalError('Escribe tu nombre para continuar.');return;}
  if(step===4&&!income.trim()){setLocalError('Agrega tu ingreso mensual aproximado, aunque sea una estimacion.');return;}
  setLocalError('');setStep(s=>Math.min(totalSteps,s+1));
 }
 function back(){setLocalError('');setStep(s=>Math.max(1,s-1));}
 return <form action={action} className="onboarding onboarding-quest">
  <input type="hidden" name="name" value={name}/><input type="hidden" name="country" value={country}/><input type="hidden" name="currency" value={currency}/><input type="hidden" name="locale" value={locale}/><input type="hidden" name="timezone" value={timezone}/><input type="hidden" name="income" value={safeAmount(income)}/><input type="hidden" name="fixed" value={safeAmount(fixed)}/><input type="hidden" name="debt" value={safeAmount(debt)}/><input type="hidden" name="reserve" value={safeAmount(reserve)}/><input type="hidden" name="objective" value={objective}/><input type="hidden" name="start" value={start}/>
  <div className="quest-progress" aria-label={`Paso ${step} de ${totalSteps}`}><span>Paso {step} de {totalSteps}</span><div><i style={{width:`${progress}%`}}/></div></div>
  <section hidden={step!==1} className="quest-step"><span className="quest-icon">*</span><p className="eyebrow">MAYORDOMIA CON CLARIDAD</p><h1>Vamos a entender lo que Dios coloco en tus manos.</h1><p className="lead">Sin culpa. Con sabiduria, prudencia y un proximo paso claro para administrar mejor.</p><Button type="button" onClick={next}>Comenzar mi camino</Button></section>
  <section hidden={step!==2} className="quest-step"><p className="eyebrow">IDENTIDAD</p><h1>Primero, como te llamas?</h1><p>Queremos acompanarte de forma personal, no tratarte como una tabla.</p><Label htmlFor="name-visible">Tu nombre</Label><Input id="name-visible" maxLength={80} autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Ej. Ana"/>{localError&&<p role="alert" className="error-message">{localError}</p>}<Button type="button" onClick={next}>Continuar</Button></section>
  <section hidden={step!==3} className="quest-step"><p className="eyebrow">CONTEXTO</p><h1>Donde vas a administrar tu dinero?</h1><p>Detectamos idioma, zona horaria y moneda cuando el navegador lo permite. Puedes cambiar todo aqui.</p><Label htmlFor="country-visible">Pais</Label><select id="country-visible" value={country} onChange={event=>selectCountry(event.target.value)}>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select><Label htmlFor="locale-visible">Idioma y formato</Label><select id="locale-visible" value={locale} onChange={event=>selectLocale(event.target.value)}>{!localeOptions.some(l=>l.value===locale)&&<option value={locale}>{locale}</option>}{localeOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><Label htmlFor="currency-visible">Moneda</Label><select id="currency-visible" value={currency} onChange={event=>setCurrency(event.target.value)}>{currencies.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}</select><Label htmlFor="timezone-visible">Zona horaria</Label><Input id="timezone-visible" value={timezone} onChange={event=>setTimezone(event.target.value)} maxLength={80}/><p className="hint">Experiencia inicial: {locale}, {timezone}, {selectedCountry.name}.</p><Button type="button" onClick={next}>Continuar</Button></section>
  <section hidden={step!==4} className="quest-step"><p className="eyebrow">PUNTO DE PARTIDA</p><h1>Comparte una primera estimacion.</h1><p>No necesitas exactitud perfecta. La claridad empieza con una foto inicial.</p><div className="quest-grid"><div><Label htmlFor="income-visible">Ingreso mensual aproximado ({currency})</Label><Input id="income-visible" inputMode="decimal" value={income} onChange={event=>setIncome(event.target.value)} placeholder="0" maxLength={24}/></div><div><Label htmlFor="fixed-visible">Gastos fijos mensuales ({currency})</Label><Input id="fixed-visible" inputMode="decimal" value={fixed} onChange={event=>setFixed(event.target.value)} placeholder="0" maxLength={24}/></div></div><p className="hint">Usa punto para decimales y evita separadores de miles.</p>{localError&&<p role="alert" className="error-message">{localError}</p>}<Button type="button" onClick={next}>Continuar</Button></section>
  <section hidden={step!==5} className="quest-step"><p className="eyebrow">CARGAS Y RESERVA</p><h1>Ahora miremos deudas y reserva con esperanza.</h1><p>Esto no es para juzgarte. Es para saber que necesita atencion.</p><div className="quest-grid"><div><Label htmlFor="debt-visible">Deudas aproximadas ({currency})</Label><Input id="debt-visible" inputMode="decimal" value={debt} onChange={event=>setDebt(event.target.value)} placeholder="0" maxLength={24}/></div><div><Label htmlFor="reserve-visible">Reserva actual ({currency})</Label><Input id="reserve-visible" inputMode="decimal" value={reserve} onChange={event=>setReserve(event.target.value)} placeholder="0" maxLength={24}/></div></div><Button type="button" onClick={next}>Continuar</Button></section>
  <section hidden={step!==6} className="quest-step"><p className="eyebrow">INTENCION</p><h1>Que quieres trabajar primero?</h1><div className="quest-choices">{objectives.map(o=><button key={o} type="button" className="quest-choice" data-selected={objective===o} onClick={()=>setObjective(o)}><span>{o}</span></button>)}</div><Button type="button" onClick={next}>Ver principio inicial</Button></section>
  <section hidden={step!==7} className="quest-step"><p className="eyebrow">PRINCIPIO INICIAL</p><h1>Tu mapa empieza con sabiduria.</h1><PrincipleCard reference={guidance.reference} principle={guidance.principle} application={guidance.application} riskContext="Esto es orientacion educativa; no mide tu fe ni promete un resultado financiero."/><h2>Como quieres dar tu primer paso?</h2><div className="quest-choices two"><button type="button" className="quest-choice" data-selected={start==='manual'} onClick={()=>setStart('manual')}><span>Registrar manualmente</span><small>Empieza con un movimiento simple.</small></button><button type="button" className="quest-choice" data-selected={start==='import'} onClick={()=>setStart('import')}><span>Subir un extracto</span><small>Organiza varios movimientos juntos.</small></button></div><label className="consent"><input name="consent" type="checkbox" required/><span>Acepto los terminos y la privacidad. MAYORDOMO ofrece organizacion e informacion financiera; las decisiones son mias.</span></label><Button type="submit" disabled={pending}>{pending?'Preparando tu mapa...':'Crear mi mapa financiero'}</Button></section>
  {state.error&&<p role="alert" className="error-message">{state.error} Puedes volver para revisar los campos.</p>}
  {step>1&&<Button type="button" variant="ghost" onClick={back}>Volver</Button>}
 </form>;
}