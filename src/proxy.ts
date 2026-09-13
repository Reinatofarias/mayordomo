import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL, hasPublicSupabaseConfig } from '@/config/public-env';
export async function proxy(request: NextRequest) {
 let response = NextResponse.next({request});
 if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('code')) {
  const target = request.nextUrl.clone();
  target.pathname = '/auth/confirm';
  return NextResponse.redirect(target);
 }
 if (!hasPublicSupabaseConfig()) return response;
 const db=createServerClient(PUBLIC_SUPABASE_URL,PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{
  getAll:()=>request.cookies.getAll(),
  setAll:values=>{
   values.forEach(({name,value})=>request.cookies.set(name,value));
   response=NextResponse.next({request});
   values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
  }
 }});
 await db.auth.getClaims();
 response.headers.set('Cache-Control','private, no-store');
 return response;
}
export const config={matcher:['/','/hoy/:path*','/movimientos/:path*','/plan/:path*','/mayordomo/:path*','/perfil/:path*','/bienvenida/:path*','/informe/:path*','/importar/:path*','/auth/:path*','/acceso/:path*','/recuperar','/api/chat']};
