begin;
create policy ai_consent_insert on public.consents for insert to authenticated with check((select auth.uid())=user_id and type='AI_FINANCIAL_INFORMATION' and version='draft-1');
create function public.confirm_import(job_id uuid) returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); job public.import_jobs; row_data jsonb; count_rows integer:=0; profile_currency text;
begin
 if uid is null then raise exception 'Unauthorized'; end if;
 if not public.has_product_access() or not public.consume_rate_limit('import') then raise exception 'Access unavailable';end if;
 select * into job from public.import_jobs where id=job_id and user_id=uid for update;
 if not found then raise exception 'Not found'; end if;
 if job.status='IMPORTED' then return 0; end if;
 if job.status<>'REVIEW_REQUIRED' or jsonb_typeof(job.preview->'rows') is distinct from 'array' then raise exception 'Not ready'; end if;
 if jsonb_array_length(job.preview->'rows') not between 1 and 500 then raise exception 'Invalid rows'; end if;
 select currency into profile_currency from public.profiles where id=uid;
 update public.import_jobs set status='CONFIRMED' where id=job_id;
 for row_data in select value from jsonb_array_elements(job.preview->'rows') loop
 if row_data->>'currency'<>profile_currency or length(row_data->>'description') not between 1 and 250 then raise exception 'Invalid row'; end if;
 insert into public.transactions(user_id,category_id,import_job_id,description,merchant,occurred_at,amount_minor,currency,kind,source,external_id)
 values(uid,(row_data->>'category_id')::uuid,job_id,row_data->>'description',coalesce(row_data->>'merchant',''),(row_data->>'occurred_at')::date,(row_data->>'amount_minor')::bigint,row_data->>'currency',row_data->>'kind','IMPORT',job_id::text||':'||count_rows::text);
 count_rows:=count_rows+1;
 end loop;
 update public.import_jobs set status='IMPORTED',preview=preview-'rawRows' where id=job_id;
 insert into public.activity_events(user_id,type) values(uid,'TRANSACTIONS_IMPORTED');
 return count_rows;
end $$;
revoke all on function public.confirm_import(uuid) from public,anon;
grant execute on function public.confirm_import(uuid) to authenticated;
commit;
