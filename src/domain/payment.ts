export type PaymentAction='ACTIVATE'|'REVOKE'|'CANCEL'|'OVERDUE'|'REVIEW'|'IGNORE';
export type PaymentEvent={
 id:string;type:string;occurredAt:string;productId:string;email:string;
 purchaseId:string;subscriptionId:string|null;plan:string;action:PaymentAction;
 accessUntil:string|null;renewalAt:string|null;purchasedAt:string|null;
};
export type PaymentPolicy={productIds:string[];accessMode:'FIXED_DAYS'|'PROVIDER_PERIOD';accessDays?:number};
export interface PaymentProvider {
 verify(headers:Headers,payload?:unknown):boolean;
 normalize(payload:unknown,policy:PaymentPolicy):PaymentEvent;
}
export function mayApplyPayment(existing:{eventAt:string;status:'ACTIVE'|'REVOKED'}|null,event:PaymentEvent){
 if(!existing)return true;
 if(Date.parse(event.occurredAt)<Date.parse(existing.eventAt))return false;
 if(Date.parse(event.occurredAt)===Date.parse(existing.eventAt)&&existing.status==='REVOKED'&&event.action==='ACTIVATE')return false;
 return true;
}
