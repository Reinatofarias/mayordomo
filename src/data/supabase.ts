import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export function isConfigured() {
 return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function createClient() {
 if (!isConfigured()) throw new Error('El servicio todavía no está configurado.');
 const jar = await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
  cookies: { getAll: () => jar.getAll(), setAll: values => {
   try { values.forEach(({name,value,options}) => jar.set(name,value,options)); }
   catch { /* Server Components rely on proxy to persist refreshed cookies. */ }
  }}
 });
}
export async function requireUser() {
 if (!isConfigured()) redirect('/acceso?estado=configuracion');
 const db = await createClient();
 const {data,error} = await db.auth.getUser();
 if (error || !data.user) redirect('/acceso');
 return {db,user:data.user};
}
