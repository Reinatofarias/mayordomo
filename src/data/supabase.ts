import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL, hasPublicSupabaseConfig } from '@/config/public-env';

export function isConfigured() {
 return hasPublicSupabaseConfig();
}
export async function createClient() {
 if (!isConfigured()) throw new Error('El servicio todavía no está configurado.');
 const jar = await cookies();
 return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
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
