'use client';
import {useActionState} from 'react';
import {requestSupport} from '@/app/(private)/perfil/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function SupportForm(){const[state,action,pending]=useActionState(requestSupport,{});return <form action={action} className="form-stack narrow"><div><label htmlFor="subject">Asunto</label><Input name="subject" id="subject" required minLength={3} maxLength={150}/></div><div><label htmlFor="message">¿Cómo podemos ayudarte?</label><textarea name="message" id="message" required minLength={10} maxLength={3000}/></div><p className="hint">No incluyas contraseñas, datos de tarjetas ni claves bancarias.</p>{state.error&&<p role="alert">{state.error}</p>}{state.message&&<p role="status">{state.message}</p>}<Button disabled={pending}>Enviar solicitud</Button></form>;}
