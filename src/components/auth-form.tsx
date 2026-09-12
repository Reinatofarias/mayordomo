'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { authenticate,recover,updatePassword,type FormState } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export function AuthForm({mode}:{mode:'login'|'signup'|'recover'|'password'}) {
 const action=mode==='recover'?recover:mode==='password'?updatePassword:authenticate;
 const [state,dispatch,pending]=useActionState<FormState,FormData>(action,{});
 return <form action={dispatch} className="form-stack">
 <input type="hidden" name="mode" value={mode}/>
 {mode!=='password'&&<div><Label htmlFor="email">Correo electrónico</Label><Input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/></div>}
 {mode!=='recover'&&<div><Label htmlFor="password">Contraseña</Label><Input id="password" name="password" type="password" minLength={12} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} required/><p className="hint">Al menos 12 caracteres.</p></div>}
 {mode==='signup'&&<label className="consent"><input type="checkbox" name="consent" required/><span>Acepto los <Link href="/terminos">términos</Link> y la <Link href="/privacidad">privacidad</Link>. Documentos provisionales sujetos a revisión.</span></label>}
 {state.error&&<p role="alert" className="error-message">{state.error}</p>}
 {state.message&&<p role="status">{state.message}</p>}
 <Button type="submit" disabled={pending}>{pending?'Un momento…':mode==='signup'?'Crear cuenta':mode==='recover'?'Enviar instrucciones':mode==='password'?'Guardar contraseña':'Iniciar sesión'}</Button>
 </form>;
}
