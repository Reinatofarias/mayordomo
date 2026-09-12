'use server';
import {createHash} from 'node:crypto';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {getContext} from '@/data/finance';
import {rateLimit} from '@/data/rate-limit';
import {parseCsv,mapImport} from '@/domain/import';
import {parseXlsx} from '@/integrations/import/xlsx';
import type {FormState} from '@/app/auth-actions';
import {logEvent} from '@/lib/logger';
export async function uploadImport(_previous:FormState,form:FormData):Promise<FormState>{
 const file=form.get('file');if(!(file instanceof File)||file.size>1000000||file.size===0)return {error:'Selecciona un CSV o XLSX de hasta 1 MB.'};
 const c=await getContext();let id:string;
 try{
 await rateLimit(c.db,'import');const buffer=Buffer.from(await file.arrayBuffer());
 const rows=file.name.toLowerCase().endsWith('.csv')?parseCsv(buffer.toString('utf8'),form.get('delimiter')===';'?';':','):file.name.toLowerCase().endsWith('.xlsx')?await parseXlsx(buffer):null;
 if(!rows)throw new Error('Formato no compatible.');
 const hash=createHash('sha256').update(buffer).digest('hex');
 const {data:existing}=await c.db.from('import_jobs').select('id').eq('user_id',c.user.id).eq('content_hash',hash).maybeSingle();
 if(existing)id=existing.id;else{const {data,error}=await c.db.from('import_jobs').insert({user_id:c.user.id,file_name:file.name.slice(0,200),content_hash:hash,status:'REVIEW_REQUIRED',preview:{headers:rows[0],rawRows:rows.slice(1)}}).select('id').single();if(error||!data)throw new Error();id=data.id;}
 }catch{logEvent('import_parse_failed',{success:false});return {error:'No pudimos leer el archivo. Revisa el formato, los encabezados y el límite de 500 movimientos.'};}
 redirect('/importar/'+id);
}
export async function mapColumns(_previous:FormState,form:FormData):Promise<FormState>{
 const c=await getContext();const parsed=z.object({id:z.uuid(),description:z.coerce.number().int().min(0).max(29),date:z.coerce.number().int().min(0).max(29),amount:z.coerce.number().int().min(0).max(29),kind:z.enum(['INCOME','EXPENSE','SIGNED']),categoryId:z.uuid()}).safeParse(Object.fromEntries(form));if(!parsed.success)return {error:'Revisa las columnas seleccionadas.'};
 const {id,...mapping}=parsed.data;const {data,error}=await c.db.from('import_jobs').select('preview,status').eq('user_id',c.user.id).eq('id',id).single();if(error||data.status!=='REVIEW_REQUIRED')return {error:'Esta importación no está disponible para cambios.'};
 try{const preview=z.object({headers:z.array(z.string()),rawRows:z.array(z.array(z.string())).max(500)}).parse(data.preview);const rows=mapImport(preview.rawRows,{...mapping,currency:c.profile.currency});const {error}=await c.db.from('import_jobs').update({preview:{...preview,rows}}).eq('user_id',c.user.id).eq('id',id).eq('status','REVIEW_REQUIRED');if(error)throw new Error();}catch(error){return {error:error instanceof Error&&error.message.startsWith('Revisa la fila')?error.message:'Revisa importes, columnas y fechas. No se importó ningún movimiento.'};}
 redirect('/importar/'+id+'?revisar=1');
}
export async function confirmImport(_previous:FormState,form:FormData):Promise<FormState>{
 const id=z.uuid().safeParse(form.get('id'));if(!id.success||form.get('confirmed')!=='on')return {error:'Revisa la vista previa y confirma antes de importar.'};
 const c=await getContext();const {error}=await c.db.rpc('confirm_import',{job_id:id.data});
 if(error)return {error:'No pudimos completar la importación. Ningún cambio parcial fue guardado.'};
 redirect('/movimientos');
}
