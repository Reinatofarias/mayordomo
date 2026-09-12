import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
export const USER_A='00000000-0000-4000-8000-000000000001';
export const USER_B='00000000-0000-4000-8000-000000000002';
export async function createDatabase(useBundle=false){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to authenticated,anon;
 grant execute on function auth.uid() to authenticated,anon;`);
 const migrations=new URL('../supabase/migrations/',import.meta.url);
 if(useBundle)await db.exec(await readFile(new URL('../supabase/SETUP.sql',import.meta.url),'utf8'));
 else for(const name of (await readdir(migrations)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,migrations),'utf8'));
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()),($3,$4,now())',[USER_A,'a@example.test',USER_B,'b@example.test']);
 return db;
}
export async function asUser(db:PGlite,id:string){await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
