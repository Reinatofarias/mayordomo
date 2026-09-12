import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/data/supabase';
export async function GET(request:NextRequest) {
 const code=request.nextUrl.searchParams.get('code');
 if(code) {
  const db=await createClient();
  const {error}=await db.auth.exchangeCodeForSession(code);
  if(!error) return NextResponse.redirect(new URL(request.nextUrl.searchParams.get('next')==='recovery'?'/recuperar?modo=nueva':'/hoy',request.url));
 }
 return NextResponse.redirect(new URL('/acceso?estado=enlace',request.url));
}
