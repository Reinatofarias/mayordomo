'use client';
import {useActionState,useState} from 'react';
import {completeOnboarding} from '@/app/bienvenida/actions';
import {countries,objectives} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export function Onboarding(){
 const [step,setStep]=useState(1),[country,setCountry]=useState('MX');
 const [state,action,pending]=useActionState(completeOnboarding,{});
 return <form action={action} className="onboarding form-stack"><p className="eyebrow">TU PRIMER PASO · {step} DE 4</p>
 <fieldset hidden={step!==1}><h1>Bienvenido a MAYORDOMO</h1><p className="lead">Tu dinero tiene una historia.<br/>Vamos a entenderla juntos.</p><Label htmlFor="name">¿Cómo te llamas?</Label><Input id="name" name="name" maxLength={80} autoComplete="name"/><Button type="button" onClick={()=>setStep(2)}>Comenzar</Button></fieldset>
 <fieldset hidden={step!==2}><h1>Antes de aconsejarte, necesito entender tu realidad.</h1><p>Son estimaciones iniciales. Después podrás registrar tus movimientos reales.</p><Label htmlFor="country">País</Label><select id="country" name="country" value={country} onChange={e=>setCountry(e.target.value)}>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select><Label htmlFor="currency">Moneda</Label><select key={country} id="currency" name="currency" defaultValue={countries.find(c=>c.code===country)?.currency}>{[...new Set(countries.map(c=>c.currency))].map(c=><option key={c}>{c}</option>)}</select>{[['income','Ingreso mensual aproximado'],['fixed','Gastos fijos mensuales'],['debt','Deudas aproximadas'],['reserve','Reserva actual']].map(([id,label])=><div key={id}><Label htmlFor={id}>{label}</Label><Input id={id} name={id} inputMode="decimal" defaultValue="0" maxLength={24}/></div>)}<p className="hint">Usa un punto para los decimales y no incluyas separadores de miles.</p><Button type="button" onClick={()=>setStep(3)}>Continuar</Button></fieldset>
 <fieldset hidden={step!==3}><h1>¿Qué quieres lograr primero?</h1><div className="choices">{objectives.map((o,i)=><label key={o}><input type="radio" name="objective" value={o} defaultChecked={i===0}/>{o}</label>)}</div><Button type="button" onClick={()=>setStep(4)}>Continuar</Button></fieldset>
 <fieldset hidden={step!==4}><h1>¿Cómo quieres empezar?</h1><div className="choices"><label><input type="radio" name="start" value="manual" defaultChecked/>Registrar manualmente</label><label><input type="radio" name="start" value="import"/>Subir un extracto</label></div><label className="consent"><input name="consent" type="checkbox"/><span>Acepto los términos y la privacidad, versión provisional. MAYORDOMO ofrece organización e información financiera; las decisiones son mías.</span></label><Button type="submit" disabled={pending}>{pending?'Preparando tu mapa…':'Crear mi mapa financiero'}</Button></fieldset>
 {state.error&&<p role="alert" className="error-message">{state.error} Puedes volver para revisar los campos.</p>}
 {step>1&&<Button type="button" variant="ghost" onClick={()=>setStep(step-1)}>Volver</Button>}
 </form>;
}
