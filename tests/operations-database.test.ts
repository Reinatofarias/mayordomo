import {test} from 'node:test';import assert from 'node:assert/strict';
import {createDatabase,asUser,USER_A,USER_B} from './database-helper.ts';
test('onboarding stores deterministic snapshot, consents and first value exactly once',async()=>{
 const db=await createDatabase();try{
 await asUser(db,USER_A);
 const profile={name:'Ana',country:'MX',currency:'MXN',locale:'es-MX',timezone:'America/Mexico_City',monthly_income_minor:'100000',fixed_expenses_minor:'30000',opening_debt_minor:'50000',reserve_minor:'10000',objective:'Ahorrar'};
 await db.query('select complete_onboarding($1::jsonb,$2::jsonb)',[JSON.stringify(profile),JSON.stringify({available:{amountMinor:'999999999'}})]);
 await db.query('select complete_onboarding($1::jsonb,$2::jsonb)',[JSON.stringify(profile),'{}']);
 const snapshot=await db.query<{amount:string}>("select data->'available'->>'amountMinor' as amount from financial_snapshots");
 assert.equal(snapshot.rows.length,1);assert.equal(snapshot.rows[0].amount,'70000');
 assert.equal((await db.query("select * from activity_events where type='FIRST_VALUE_COMPLETED'")).rows.length,1);
 assert.equal((await db.query('select * from consents')).rows.length,2);
 await assert.rejects(db.exec("update profiles set onboarding_completed_at=null"));
 }finally{await db.close();}
});
test('confirmed imports are atomic, reject foreign users and remain idempotent',async()=>{
 const db=await createDatabase();try{
 await asUser(db,USER_A);
 const category=(await db.query<{id:string}>('select id from categories limit 1')).rows[0].id;
 const row={description:'Compra',occurred_at:'2026-09-01',amount_minor:'1099',currency:'MXN',kind:'EXPENSE',category_id:category};
 const job=(await db.query<{id:string}>("insert into import_jobs(user_id,status,file_name,content_hash,preview) values($1,'REVIEW_REQUIRED','test.csv','hash-1',$2::jsonb) returning id",[USER_A,JSON.stringify({headers:['date','description','amount'],rows:[row,row]})])).rows[0].id;
 await asUser(db,USER_B);await assert.rejects(db.query('select confirm_import($1)',[job]));await asUser(db,USER_A);
 assert.equal((await db.query<{count:number}>('select confirm_import($1) as count',[job])).rows[0].count,2);
 assert.equal((await db.query<{count:number}>('select confirm_import($1) as count',[job])).rows[0].count,0);
 assert.equal((await db.query('select * from transactions')).rows.length,2);
 const badJob=(await db.query<{id:string}>("insert into import_jobs(user_id,status,file_name,content_hash,preview) values($1,'REVIEW_REQUIRED','bad.csv','hash-2',$2::jsonb) returning id",[USER_A,JSON.stringify({rows:[row,{...row,amount_minor:'-1'}]})])).rows[0].id;
 await assert.rejects(db.query('select confirm_import($1)',[badJob]));
 assert.equal((await db.query('select * from transactions')).rows.length,2);
 assert.equal((await db.query<{status:string}>('select status from import_jobs where id=$1',[badJob])).rows[0].status,'REVIEW_REQUIRED');
 }finally{await db.close();}
});
test('rate limits persist in the database and message webhook IDs deduplicate',async()=>{
 const db=await createDatabase();try{
 await asUser(db,USER_A);
 for(let i=0;i<10;i++)assert.equal((await db.query<{allowed:boolean}>("select consume_rate_limit('ai') as allowed")).rows[0].allowed,true);
 assert.equal((await db.query<{allowed:boolean}>("select consume_rate_limit('ai') as allowed")).rows[0].allowed,false);
 assert.equal((await db.query<{allowed:boolean}>("select consume_rate_limit('arbitrary-key') as allowed")).rows[0].allowed,false);
 await assert.rejects(db.query('select receive_whatsapp_event($1::jsonb)',['{"externalId":"id-1","from":"5215555555555"}']));
 await db.exec('reset role');
 await db.query('select receive_whatsapp_event($1::jsonb)',['{"externalId":"id-1","from":"5215555555555"}']);
 await db.query('select receive_whatsapp_event($1::jsonb)',['{"externalId":"id-1","from":"5215555555555"}']);
 assert.equal((await db.query('select * from private.messaging_events')).rows.length,1);
 }finally{await db.close();}
});

