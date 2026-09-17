'use server';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';

export async function markNotificationsRead(formData?:FormData){
 const c=await getContext(false);
 const now=new Date().toISOString();
 await c.db.from('notifications').update({read_at:now}).eq('user_id',c.user.id).is('read_at',null);
 const dismissKeys=formData?.getAll('dismissKey').map(String).filter(key=>/^[a-z0-9-]{1,120}$/.test(key))??[];
 if(dismissKeys.length){
  await c.db.from('notification_dismissals').upsert(dismissKeys.map(key=>({user_id:c.user.id,key,dismissed_at:now})),{onConflict:'user_id,key'});
 }
 revalidatePath('/hoy');
 revalidatePath('/notificaciones');
 revalidatePath('/perfil');
}