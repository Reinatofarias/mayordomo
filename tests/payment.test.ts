import {test} from 'node:test';import assert from 'node:assert/strict';
import {HotmartPaymentProvider} from '../src/integrations/payments/hotmart.ts';
import {mayApplyPayment} from '../src/domain/payment.ts';
const provider=new HotmartPaymentProvider('test-only-token');
const policy={productIds:['123'],accessMode:'FIXED_DAYS' as const,accessDays:30};
const payload={id:'event-1',event:'PURCHASE_APPROVED',creation_date:1700000000000,version:'2.0.0',data:{product:{id:123},buyer:{email:'buyer@example.test'},purchase:{transaction:'purchase-1',approved_date:1700000000000}}};
test('Hotmart rejects missing and incorrect webhook tokens',()=>{assert.equal(provider.verify(new Headers()),false);assert.equal(provider.verify(new Headers({'X-HOTMART-HOTTOK':'bad'})),false);assert.equal(provider.verify(new Headers({'X-HOTMART-HOTTOK':'test-only-token'})),true);});
test('Hotmart requires configured product and access policy',()=>{const event=provider.normalize(payload,policy);assert.equal(event.action,'ACTIVATE');assert.equal(event.accessUntil,'2023-12-14T22:13:20.000Z');assert.throws(()=>provider.normalize(payload,{...policy,productIds:['other']}));assert.throws(()=>provider.normalize(payload,{productIds:['123'],accessMode:'PROVIDER_PERIOD'}));});
test('refund and chargeback revoke; old approvals cannot overwrite revocation',()=>{const refunded=provider.normalize({...payload,event:'PURCHASE_REFUNDED'},policy);assert.equal(refunded.action,'REVOKE');assert.equal(provider.normalize({...payload,event:'PURCHASE_CHARGEBACK'},policy).action,'REVOKE');assert.equal(mayApplyPayment({eventAt:refunded.occurredAt,status:'REVOKED'},provider.normalize(payload,policy)),false);});
test('cancellation preserves explicit remaining period and does not activate access',()=>{const event=provider.normalize({...payload,event:'SUBSCRIPTION_CANCELLATION',data:{product:{id:123},subscriber:{code:'subscriber-1',email:'buyer@example.test'},date_next_charge:1701000000000}},policy);assert.equal(event.action,'CANCEL');assert.equal(event.accessUntil,'2023-11-26T12:00:00.000Z');});

