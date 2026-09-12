import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createDatabase,asUser,USER_A,USER_B} from './database-helper.ts';

test('installation bundle applies atomically and refuses existing schema without data loss',async()=>{
 const db=await createDatabase(true);
 try{
  await asUser(db,USER_A);
  const goal=await db.query<{id:string}>("insert into goals(user_id,name,target_amount_minor,current_amount_minor,currency) values($1,'Reserva',10000,500,'MXN') returning id",[USER_A]);
  await asUser(db,USER_B);
  assert.equal((await db.query('update goals set current_amount_minor=9000 where id=$1 returning id',[goal.rows[0].id])).rows.length,0);
  await asUser(db,USER_A);
  assert.equal((await db.query<{amount:string}>('update goals set current_amount_minor=750 where id=$1 returning current_amount_minor::text as amount',[goal.rows[0].id])).rows[0].amount,'750');
  await db.query("insert into debts(user_id,name,balance_minor,monthly_payment_minor,currency) values($1,'Pagada',0,0,'MXN')",[USER_A]);
  await db.exec('reset role');
  await assert.rejects(db.exec(await readFile(new URL('../supabase/SETUP.sql',import.meta.url),'utf8')),/Schema existente/);
  await db.exec('rollback');
  assert.equal((await db.query('select * from goals')).rows.length,1);
 }finally{await db.close();}
});
