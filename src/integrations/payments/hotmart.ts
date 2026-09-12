import {timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import type {PaymentProvider,PaymentEvent,PaymentPolicy,PaymentAction} from '../../domain/payment.ts';
const text=z.string().min(1).max(250);
const millis=z.number().int().min(0).max(8640000000000000);
const base=z.object({id:text,event:text,creation_date:millis,version:z.literal('2.0.0'),data:z.record(z.string(),z.unknown())});
const product=z.object({id:z.union([z.number().int(),text])});
const purchaseData=z.object({
 product,buyer:z.object({email:z.email()}),
 purchase:z.object({transaction:text,approved_date:millis.optional(),date_next_charge:millis.optional()}),
 subscription:z.object({subscriber:z.object({code:text}),plan:z.object({name:text}).optional()}).optional()
});
const cancellationData=z.object({product,subscriber:z.object({code:text,email:z.email()}),date_next_charge:millis.optional(),subscription:z.object({plan:z.object({name:text}).optional()}).optional()});
export class HotmartPaymentProvider implements PaymentProvider{
 private readonly token:string;
 constructor(token:string){this.token=token;}
 verify(headers:Headers){const actual=headers.get('x-hotmart-hottok');if(!actual||!this.token)return false;const a=Buffer.from(actual),b=Buffer.from(this.token);return a.length===b.length&&timingSafeEqual(a,b);}
 normalize(payload:unknown,policy:PaymentPolicy):PaymentEvent{
 const event=base.parse(payload);const occurredAt=new Date(event.creation_date).toISOString();
 if(event.event==='SUBSCRIPTION_CANCELLATION'){
 const data=cancellationData.parse(event.data);const productId=String(data.product.id);
 if(!policy.productIds.includes(productId))throw new Error('Product not configured');
 return {id:event.id,type:event.event,occurredAt,productId,email:data.subscriber.email.toLowerCase(),purchaseId:data.subscriber.code,subscriptionId:data.subscriber.code,plan:data.subscription?.plan?.name??'MAYORDOMO',action:'CANCEL',accessUntil:data.date_next_charge?new Date(data.date_next_charge).toISOString():null,renewalAt:null,purchasedAt:null};
 }
 const data=purchaseData.parse(event.data);const productId=String(data.product.id);
 if(!policy.productIds.includes(productId))throw new Error('Product not configured');
 const actions:Record<string,PaymentAction>={PURCHASE_APPROVED:'ACTIVATE',PURCHASE_COMPLETE:'ACTIVATE',PURCHASE_REFUNDED:'REVOKE',PURCHASE_CHARGEBACK:'REVOKE',PURCHASE_DELAYED:'OVERDUE',PURCHASE_PROTEST:'REVIEW'};
 const action=actions[event.event]??'IGNORE';let accessUntil:string|null=null;
 if(action==='ACTIVATE'){
 if(policy.accessMode==='PROVIDER_PERIOD'){if(!data.purchase.date_next_charge)throw new Error('Access period not provided');accessUntil=new Date(data.purchase.date_next_charge).toISOString();}
 else{if(!policy.accessDays||!Number.isInteger(policy.accessDays)||policy.accessDays<1||policy.accessDays>3660||!data.purchase.approved_date)throw new Error('Access policy not configured');accessUntil=new Date(data.purchase.approved_date+policy.accessDays*86400000).toISOString();}
 }
 return {id:event.id,type:event.event,occurredAt,productId,email:data.buyer.email.toLowerCase(),purchaseId:data.purchase.transaction,subscriptionId:data.subscription?.subscriber.code??null,plan:data.subscription?.plan?.name??'MAYORDOMO',action,accessUntil,renewalAt:data.purchase.date_next_charge?new Date(data.purchase.date_next_charge).toISOString():null,purchasedAt:data.purchase.approved_date?new Date(data.purchase.approved_date).toISOString():null};
 }
}
