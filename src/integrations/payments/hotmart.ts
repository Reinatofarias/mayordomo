import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import type {PaymentProvider,PaymentEvent,PaymentPolicy,PaymentAction} from '../../domain/payment.ts';
const text=z.string().min(1).max(250);
const millis=z.number().int().min(0).max(8640000000000000);
const hotmartDate=z.union([millis,z.string().min(1)]);
const base=z.object({id:text,event:text,creation_date:millis,version:z.literal('2.0.0'),data:z.record(z.string(),z.unknown())});
const product=z.object({id:z.union([z.number().int(),text])});
const purchaseData=z.object({
 product,buyer:z.object({email:z.email()}),
 purchase:z.object({transaction:text,approved_date:hotmartDate.optional(),date_next_charge:hotmartDate.optional()}),
 subscription:z.object({subscriber:z.object({code:text}),plan:z.object({name:text}).optional()}).optional()
});
const cancellationData=z.object({product:product.optional(),subscriber:z.object({code:text,email:z.email().optional()}),date_next_charge:hotmartDate.optional(),subscription:z.object({product:product.optional(),date_next_charge:hotmartDate.optional(),plan:z.object({name:text}).optional()}).optional(),plan:z.object({name:text}).optional()});
function payloadHottok(payload:unknown){
 if(!payload||typeof payload!=='object'||!('hottok' in payload))return null;
 const value=(payload as {hottok?:unknown}).hottok;
 return typeof value==='string'?value:null;
}
function productAllowed(productId:string,policy:PaymentPolicy){return productId==='0'||policy.productIds.includes(productId);}
function toIso(value:number|string){return new Date(value).toISOString();}
export class HotmartPaymentProvider implements PaymentProvider{
 private readonly token:string;
 constructor(token:string){this.token=token.trim();}
 verify(headers:Headers,payload?:unknown){const actual=(headers.get('x-hotmart-hottok')??payloadHottok(payload)??'').trim();if(!actual||!this.token)return false;const a=Buffer.from(actual),b=Buffer.from(this.token);return a.length===b.length&&timingSafeEqual(a,b);}
 normalize(payload:unknown,policy:PaymentPolicy):PaymentEvent{
 const event=base.parse(payload);const occurredAt=new Date(event.creation_date).toISOString();
 if(event.event==='SUBSCRIPTION_CANCELLATION'){
 const data=cancellationData.parse(event.data);const item=data.product??data.subscription?.product;if(!item)throw new Error('Product not provided');const productId=String(item.id);
 if(!productAllowed(productId,policy))throw new Error('Product not configured');
 const accessUntil=data.date_next_charge??data.subscription?.date_next_charge;
 return {id:event.id,type:event.event,occurredAt,productId,email:data.subscriber.email?.toLowerCase()??'',purchaseId:data.subscriber.code,subscriptionId:data.subscriber.code,plan:data.subscription?.plan?.name??data.plan?.name??'MAYORDOMO',action:'CANCEL',accessUntil:accessUntil?toIso(accessUntil):null,renewalAt:null,purchasedAt:null};
 }
 const data=purchaseData.parse(event.data);const productId=String(data.product.id);
 if(!productAllowed(productId,policy))throw new Error('Product not configured');
 const actions:Record<string,PaymentAction>={PURCHASE_APPROVED:'ACTIVATE',PURCHASE_COMPLETE:'ACTIVATE',PURCHASE_REFUNDED:'REVOKE',PURCHASE_CHARGEBACK:'REVOKE',PURCHASE_DELAYED:'OVERDUE',PURCHASE_PROTEST:'REVIEW'};
 const action=actions[event.event]??'IGNORE';let accessUntil:string|null=null;
 if(action==='ACTIVATE'){
 if(policy.accessMode==='PROVIDER_PERIOD'){if(!data.purchase.date_next_charge)throw new Error('Access period not provided');accessUntil=toIso(data.purchase.date_next_charge);}
 else{if(!policy.accessDays||!Number.isInteger(policy.accessDays)||policy.accessDays<1||policy.accessDays>3660||!data.purchase.approved_date)throw new Error('Access policy not configured');accessUntil=new Date(Date.parse(toIso(data.purchase.approved_date))+policy.accessDays*86400000).toISOString();}
 }
 return {id:event.id,type:event.event,occurredAt,productId,email:data.buyer.email.toLowerCase(),purchaseId:data.purchase.transaction,subscriptionId:data.subscription?.subscriber.code??null,plan:data.subscription?.plan?.name??'MAYORDOMO',action,accessUntil,renewalAt:data.purchase.date_next_charge?toIso(data.purchase.date_next_charge):null,purchasedAt:data.purchase.approved_date?toIso(data.purchase.approved_date):null};
 }
}
