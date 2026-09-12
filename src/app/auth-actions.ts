'use server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, isConfigured } from '@/data/supabase';
export type FormState={error?:string;message?:string};
const credentials=z.object({email:z.email().max(254),password:z.string().min(12).max(128)});
async function getAppUrl() {
 if (process.env.APP_URL) return process.env.APP_URL;
 const incoming = await headers();
 const host = incoming.get('x-forwarded-host') || incoming.get('host');
 const protocol = incoming.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
 return host ? `${protocol}://${host}` : 'http://localhost:3000';
}
export async function authenticate(_previous:FormState,form:FormData):Promise<FormState> {
 if(!isConfigured()) return {error:'El servicio todavía no está disponible. Inténtalo más tarde.'};
 const mode=form.get('mode');
 const parsed=credentials.safeParse(Object.fromEntries(form));
 if(!parsed.success) return {error:'Revisa tu correo y contraseña (mínimo 12 caracteres).'};
 const db=await createClient();
 if(mode==='signup') {
  if(form.get('consent')!=='on') return {error:'Debes aceptar los términos y la privacidad.'};
  const {error}=await db.auth.signUp({...parsed.data,options:{emailRedirectTo:new URL('/auth/confirm',await getAppUrl()).toString(),data:{terms_version:'draft-1'}}});
  if(error) return {error:'No pudimos completar la solicitud. Revisa tus datos e inténtalo más tarde.'};
  return {message:'Revisa tu correo para confirmar tu cuenta y continuar.'};
 }
 const {error}=await db.auth.signInWithPassword(parsed.data);
 if(error) return {error:'No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.'};
 redirect('/hoy');
}
export async function signOut() {
 const db=await createClient();
 await db.auth.signOut();
 redirect('/acceso');
}
export async function recover(_previous:FormState,form:FormData):Promise<FormState> {
 const email=z.email().safeParse(form.get('email'));
 if(!email.success) return {error:'Escribe un correo válido.'};
 if(!isConfigured()) return {error:'El servicio todavía no está disponible.'};
 const db=await createClient();
 await db.auth.resetPasswordForEmail(email.data,{redirectTo:new URL('/auth/confirm?next=recovery',await getAppUrl()).toString()});
 return {message:'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar el acceso.'};
}
export async function updatePassword(_previous:FormState,form:FormData):Promise<FormState> {
 const password=z.string().min(12).max(128).safeParse(form.get('password'));
 if(!password.success) return {error:'Usa al menos 12 caracteres.'};
 const db=await createClient();
 const {data}=await db.auth.getUser();
 if(!data.user) return {error:'El enlace expiró. Solicita uno nuevo.'};
 const {error}=await db.auth.updateUser({password:password.data});
 if(error) return {error:'No pudimos actualizar la contraseña. Solicita un nuevo enlace.'};
 await db.auth.signOut();
 return {message:'Contraseña actualizada. Ya puedes iniciar sesión.'};
}
