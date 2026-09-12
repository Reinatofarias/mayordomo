import 'server-only';
import type {createClient} from './supabase';
export async function rateLimit(db:Awaited<ReturnType<typeof createClient>>,action:string){
 const {data,error}=await db.rpc('consume_rate_limit',{action_name:action});
 if(error||data!==true)throw new Error('Espera un momento antes de volver a intentarlo.');
}
