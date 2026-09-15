'use server';
import {revalidatePath} from 'next/cache';
import {getContext} from '@/data/finance';

export async function markNotificationsRead(){
 const c=await getContext(false);
 await c.db.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',c.user.id).is('read_at',null);
 revalidatePath('/hoy');
 revalidatePath('/perfil');
}
