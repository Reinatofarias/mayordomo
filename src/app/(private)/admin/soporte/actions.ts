'use server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {notFound} from 'next/navigation';
import {requireUser} from '@/data/supabase';
import {adminClient} from '@/data/admin';
import {isSupportAdmin} from '@/data/support';

async function requireSupportAdmin(){
 const {user}=await requireUser();
 if(!isSupportAdmin(user.email))notFound();
 return user;
}

export async function replySupportRequest(form:FormData){
 await requireSupportAdmin();
 const parsed=z.object({requestId:z.uuid(),userId:z.uuid(),message:z.string().trim().min(2).max(3000)}).parse(Object.fromEntries(form));
 const admin=adminClient();
 await admin.from('support_messages').insert({user_id:parsed.userId,request_id:parsed.requestId,sender:'admin',message:parsed.message});
 await admin.from('support_requests').update({status:'OPEN'}).eq('id',parsed.requestId).eq('user_id',parsed.userId);
 await admin.from('notifications').insert({user_id:parsed.userId,message:'Soporte humano respondio tu conversacion. Revisa Ayuda.'});
 revalidatePath('/admin/soporte');
 revalidatePath('/ayuda');
}

export async function resolveSupportRequest(form:FormData){
 await requireSupportAdmin();
 const parsed=z.object({requestId:z.uuid(),userId:z.uuid()}).parse(Object.fromEntries(form));
 const admin=adminClient();
 await admin.from('support_requests').update({status:'RESOLVED'}).eq('id',parsed.requestId).eq('user_id',parsed.userId);
 await admin.from('support_messages').insert({user_id:parsed.userId,request_id:parsed.requestId,sender:'system',message:'El caso fue marcado como resuelto por soporte.'});
 await admin.from('notifications').insert({user_id:parsed.userId,message:'Tu solicitud de soporte fue marcada como resuelta.'});
 revalidatePath('/admin/soporte');
 revalidatePath('/ayuda');
}