'use client';
import {useActionState} from 'react';
import {updateProfile} from '@/app/(private)/perfil/actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export function ProfileForm({profile}:{profile:{name:string;phone?:string|null;locale:string;timezone:string}}){
 const [state,action,pending]=useActionState(updateProfile,{});
 return <form action={action} className="form-stack narrow profile-form">
  <div><Label htmlFor="name">Nombre</Label><Input id="name" name="name" required maxLength={80} defaultValue={profile.name}/></div>
  <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" name="phone" maxLength={40} defaultValue={profile.phone??''} placeholder="Opcional"/></div>
  <div><Label htmlFor="locale">Idioma y formato</Label><select id="locale" name="locale" defaultValue={profile.locale}><option value="es-MX">Español · México</option><option value="es-CO">Español · Colombia</option><option value="es-CL">Español · Chile</option><option value="es-PE">Español · Perú</option><option value="es-AR">Español · Argentina</option><option value="es-EC">Español · Ecuador</option><option value="es-US">Español · Estados Unidos</option><option value="pt-BR">Português · Brasil</option></select></div>
  <div><Label htmlFor="timezone">Zona horaria</Label><Input id="timezone" name="timezone" required maxLength={80} defaultValue={profile.timezone}/><p className="hint">Ejemplo: America/Mexico_City, America/Sao_Paulo o America/New_York.</p></div>
  {state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}
  <Button disabled={pending}>{pending?'Guardando…':'Guardar perfil'}</Button>
 </form>;
}
