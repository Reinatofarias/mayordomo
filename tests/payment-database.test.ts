import {test} from 'node:test';import assert from 'node:assert/strict';
import {createDatabase,asUser,USER_A} from './database-helper.ts';
const base={id:'payment-1',type:'PURCHASE_APPROVED',occurredAt:'2026-09-01T00:00:00Z',productId:'123',email:'a@example.test',purchaseId:'purchase-1',subscriptionId:'subscriber-1',plan:'MAYORDOMO',action:'ACTIVATE',accessUntil:'2099-10-01T00:00:00Z',renewalAt:'2099-10-01T00:00:00Z',purchasedAt:'2026-09-01T00:00:00Z'};
test('payment events are atomic, idempotent and cannot resurrect a refunded purchase',async()=>{
 const db=await createDatabase();try{
 const process=async(event:typeof base)=>db.query<{result:string}>('select public.process_payment_event($1::jsonb) as result',[JSON.stringify(event)]);
 assert.equal((await process(base)).rows[0].result,'APPLIED');
 assert.equal((await process(base)).rows[0].result,'DUPLICATE');
 assert.equal((await db.query('select * from entitlements')).rows.length,1);
 await process({...base,id:'refund-1',action:'REVOKE',type:'PURCHASE_REFUNDED',occurredAt:'2026-09-02T00:00:00Z'});
 await process({...base,id:'late-complete',type:'PURCHASE_COMPLETE',occurredAt:'2026-09-03T00:00:00Z'});
 assert.equal((await db.query<{status:string}>('select status from entitlements')).rows[0].status,'REVOKED');
 await db.exec('update private.app_configuration set billing_enforced=true');await asUser(db,USER_A);
 assert.equal((await db.query<{allowed:boolean}>('select has_product_access() as allowed')).rows[0].allowed,false);
 await assert.rejects(process({...base,id:'forged-approval'}));
 }finally{await db.close();}
});
test('cancellation preserves a paid period and unmatched payments require a verified matching email',async()=>{
 const db=await createDatabase();try{
 await db.query('select process_payment_event($1::jsonb)',[JSON.stringify(base)]);
 await db.query('select process_payment_event($1::jsonb)',[JSON.stringify({...base,id:'cancel-1',action:'CANCEL',type:'SUBSCRIPTION_CANCELLATION',occurredAt:'2026-09-02T00:00:00Z',accessUntil:'2099-09-15T00:00:00Z'})]);
 assert.equal((await db.query<{expiry:string}>("select to_char(access_until at time zone 'UTC','YYYY-MM-DD') as expiry from entitlements")).rows[0].expiry,'2099-09-15');
 await db.query('select process_payment_event($1::jsonb)',[JSON.stringify({...base,id:'unmatched',purchaseId:'future-purchase',subscriptionId:'future-sub',email:'future@example.test'})]);
 assert.equal((await db.query<{status:string}>("select status from payment_events where external_id='unmatched'")).rows[0].status,'UNMATCHED');
 await db.query('insert into auth.users(id,email) values($1,$2)',['00000000-0000-4000-8000-000000000099','future@example.test']);
 await asUser(db,'00000000-0000-4000-8000-000000000099');
 assert.equal((await db.query<{count:number}>('select claim_pending_payments() as count')).rows[0].count,0);
 await db.exec("reset role;update auth.users set email_confirmed_at=now() where email='future@example.test'");
 await asUser(db,'00000000-0000-4000-8000-000000000099');
 assert.equal((await db.query<{count:number}>('select claim_pending_payments() as count')).rows[0].count,1);
 }finally{await db.close();}
});
