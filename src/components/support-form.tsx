'use client';
import {useActionState} from 'react';
import {requestSupport} from '@/app/(private)/perfil/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export function SupportForm(){const[state,action,pending]=useActionState(requestSupport,{});return <form action={action} className="form-stack narrow"><div><Label htmlFor="subject">Asunto</Label><Input name="subject" id="subject" required minLength={3} maxLength={150} placeholder="Ej. No veo mi acceso"/></div><div><Label htmlFor="message">¿Cómo podemos ayudarte?</Label><textarea name="message" id="message" required minLength={10} maxLength={3000} placeholder="Cuéntanos qué intentaste, qué esperabas ver y qué apareció."/></div><p className="hint">No incluyas contraseñas, datos de tarjetas ni claves bancarias.</p>{state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}<Button disabled={pending}>{pending?'Enviando…':'Enviar solicitud'}</Button></form>;}
