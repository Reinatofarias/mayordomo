'use server';
import {redirect} from 'next/navigation';
import {requireUser} from '@/data/supabase';
import {claimPendingProductAccess,hasProductAccess} from '@/data/access';

export async function refreshHotmartAccess(){
 const {db}=await requireUser();
 await claimPendingProductAccess(db);
 if(await hasProductAccess(db))redirect('/hoy');
 redirect('/acceso/pendiente?estado=pendiente');
}
