import 'server-only';
import {redirect} from 'next/navigation';
import {requireUser} from './supabase';

type Db=Awaited<ReturnType<typeof requireUser>>['db'];

export function normalizeCheckoutUrl(value:string|undefined){
 const raw=value?.trim();
 if(!raw)return '';
 const repaired=raw.replace(/https?:\/(?!\/)/gi,match=>match+'\/');
 const candidate=repaired.match(/https?:\/\/pay\.hotmart\.com\/[^\s)]+/i)?.[0]??repaired.match(/https?:\/\/[^\s)]+/i)?.[0]??(/^pay\.hotmart\.com\//i.test(repaired)?'https://'+repaired:repaired);
 try{
  const url=new URL(candidate);
  if(url.protocol!=='https:'&&url.protocol!=='http:')return '';
  return url.toString();
 }catch{return '';}
}

export function hotmartCheckoutUrl(){
 return normalizeCheckoutUrl(process.env.HOTMART_CHECKOUT_URL);
}

export async function claimPendingProductAccess(db:Db){
 if(process.env.HOTMART_ENABLED!=='true')return 0;
 const {data,error}=await db.rpc('claim_pending_payments');
 if(error)throw new Error('No pudimos verificar tu compra.');
 return typeof data==='number'?data:0;
}

export async function hasProductAccess(db:Db){
 const {data,error}=await db.rpc('has_product_access');
 if(error)throw new Error('No pudimos verificar tu acceso.');
 return data===true;
}

export async function requireProductAccess(db:Db){
 await claimPendingProductAccess(db);
 if(!await hasProductAccess(db))redirect('/acceso/pendiente');
}
