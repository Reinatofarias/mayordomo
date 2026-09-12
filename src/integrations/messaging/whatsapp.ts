import {createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import type {IncomingMessage,MessagingProvider} from './provider.ts';
const messageSchema=z.object({id:z.string().min(1).max(300),from:z.string().regex(/^\d{6,20}$/),timestamp:z.string().regex(/^\d{1,12}$/),type:z.string(),text:z.object({body:z.string().max(10000)}).optional(),image:z.object({id:z.string()}).optional(),audio:z.object({id:z.string()}).optional()});
const envelope=z.object({object:z.literal('whatsapp_business_account'),entry:z.array(z.object({changes:z.array(z.object({value:z.object({messages:z.array(messageSchema).optional()})}))}))});
export class WhatsAppProvider implements MessagingProvider{
 private readonly secret:string;
 constructor(secret:string){this.secret=secret;}
 verify(raw:Uint8Array,signature:string|null){if(!this.secret||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;const expected=createHmac('sha256',this.secret).update(raw).digest();const actual=Buffer.from(signature.slice(7),'hex');return timingSafeEqual(expected,actual);}
 normalize(payload:unknown):IncomingMessage[]{
 const data=envelope.parse(payload);return data.entry.flatMap(entry=>entry.changes.flatMap(change=>(change.value.messages??[]).map(message=>({
 externalId:message.id,from:message.from,receivedAt:new Date(Number(message.timestamp)*1000).toISOString(),type:message.type==='text'?'TEXT' as const:message.type==='image'?'IMAGE' as const:message.type==='audio'?'AUDIO' as const:'UNSUPPORTED' as const,text:message.text?.body,mediaId:message.image?.id??message.audio?.id
 }))));
 }
}

