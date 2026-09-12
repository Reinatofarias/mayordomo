import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('migration enforces tenant isolation and protects billing writes', async () => {
 const db = new PGlite();
 try {
 await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to authenticated,anon;
 grant execute on function auth.uid() to authenticated,anon;
 `);
 const migrations=new URL('../supabase/migrations/',import.meta.url);
 for(const name of (await readdir(migrations)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,migrations),'utf8'));
 await db.exec(`
 insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-8000-000000000001','a@example.test',now()),('00000000-0000-4000-8000-000000000002','b@example.test',now());
 insert into public.financial_accounts(id,user_id,name,currency) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002','Cuenta B','MXN');
 set role authenticated;
 set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
 `);
 assert.equal((await db.query('select * from profiles')).rows.length,1);
 assert.equal((await db.query('select * from financial_accounts')).rows.length,0);
 await assert.rejects(db.exec(`insert into goals(user_id,name,target_amount_minor,currency) values('00000000-0000-4000-8000-000000000002','Ataque',100,'MXN')`));
 await db.exec(`insert into transactions(user_id,category_id,description,occurred_at,amount_minor,currency,kind,source,external_id) select '00000000-0000-4000-8000-000000000001',id,'Compra',current_date,25000,'MXN','EXPENSE','MANUAL','test-1' from categories limit 1`);
 assert.equal((await db.query('select * from transactions')).rows.length,1);
 await assert.rejects(db.exec(`insert into transactions(user_id,account_id,category_id,description,occurred_at,amount_minor,currency,kind,source) select '00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003',id,'Ataque',current_date,1,'MXN','EXPENSE','MANUAL' from categories limit 1`));
 await assert.rejects(db.exec(`insert into entitlements(user_id,provider,purchase_id,status,event_at) values('00000000-0000-4000-8000-000000000001','hotmart','fake','ACTIVE',now())`));
 await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'`);
 assert.equal((await db.query('select * from transactions')).rows.length,0);
 await db.exec(`update transactions set description='Ataque'; delete from transactions;`);
 await db.exec(`set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001'`);
 assert.equal((await db.query<{description:string}>('select description from transactions')).rows[0].description,'Compra');
 } finally { await db.close(); }
});
