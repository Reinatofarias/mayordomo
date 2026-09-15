import {z} from 'zod';
import {notFound} from 'next/navigation';
import {getContext,getCategories,getTransactions,localMonth} from '@/data/finance';
import {MappingForm,ConfirmImport} from '@/components/import-forms';
import {displayMoney} from '@/i18n/es';
import {PrincipleCard} from '@/components/principle-card';

const previewSchema=z.object({
 headers:z.array(z.string()),
 rawRows:z.array(z.array(z.string())).default([]),
 rows:z.array(z.object({description:z.string(),occurred_at:z.string(),amount_minor:z.string(),currency:z.string(),kind:z.enum(['INCOME','EXPENSE']),category_id:z.string().optional()})).optional()
});

function statusLabel(status:string){return status==='IMPORTED'?'Ya importado':status==='REVIEW_REQUIRED'?'Listo para revisar':status;}

export default async function Review({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const c=await getContext();
 const [{data,error},categories,existing,{data:principle}]=await Promise.all([
  c.db.from('import_jobs').select('file_name,status,preview').eq('user_id',c.user.id).eq('id',id).single(),
  getCategories(c),
  getTransactions(c,localMonth(c.profile.timezone)),
  c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','responsabilidad').eq('active',true).single()
 ]);
 if(error||!data)notFound();const preview=previewSchema.parse(data.preview);const categoryNames=new Map(categories.map(category=>[category.id,category.name]));
 const duplicates=new Set(existing.map(t=>`${t.occurredAt}:${t.amountMinor}:${t.currency}:${t.kind}`));
 const rows=preview.rows??[];const income=rows.filter(r=>r.kind==='INCOME'),expenses=rows.filter(r=>r.kind==='EXPENSE');
 const duplicateCount=rows.filter(r=>duplicates.has(`${r.occurred_at}:${r.amount_minor}:${r.currency}:${r.kind}`)).length;
 return <>
  <header className="page-heading"><p className="eyebrow">IMPORTACIÓN GUIADA</p><h1>Revisar importación</h1><p>{data.file_name} · {statusLabel(data.status)}</p></header>
  <section className="import-guidance">
   <div><h2>Antes de guardar, mira la historia completa.</h2><p>Confirma fechas, importes y sentido de cada movimiento. La fidelidad en lo pequeño empieza con datos claros.</p></div>
   {principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}
  </section>
  {data.status==='IMPORTED'?<section className="empty"><h2>Este archivo ya fue importado.</h2><p>No se duplicarán sus movimientos. Puedes revisar tus registros en Movimientos.</p></section>:<>
   {rows.length?<>
    <dl className="metric-grid import-summary"><div><dt>Movimientos</dt><dd>{rows.length}</dd></div><div><dt>Gastos</dt><dd>{expenses.length}</dd></div><div><dt>Ingresos</dt><dd>{income.length}</dd></div><div><dt>Posibles duplicados</dt><dd>{duplicateCount}</dd></div></dl>
    {duplicateCount>0&&<p className="status-warning">Detectamos {duplicateCount} posible(s) coincidencia(s) con movimientos de este mes. Revisa antes de confirmar.</p>}
    <div className="import-preview-table" role="region" aria-label="Movimientos detectados" tabIndex={0}><table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría sugerida</th><th>Tipo</th><th>Importe</th><th>Revisión</th></tr></thead><tbody>{rows.map((row,index)=>{const duplicated=duplicates.has(`${row.occurred_at}:${row.amount_minor}:${row.currency}:${row.kind}`);return <tr key={index} data-warning={duplicated||undefined}><td>{row.occurred_at}</td><td>{row.description}</td><td>{categoryNames.get(row.category_id??'')??'Categoría inicial'}</td><td>{row.kind==='EXPENSE'?'Gasto':'Ingreso'}</td><td>{displayMoney(row.amount_minor,row.currency,c.profile.locale)}</td><td>{duplicated?'Posible duplicado':'Lista'}</td></tr>;})}</tbody></table></div>
    <ConfirmImport id={id} count={rows.length}/>
   </>:<section className="section"><h2>Selecciona columnas</h2><p>Detectamos los encabezados del archivo. MAYORDOMO sugiere columnas automáticamente, pero puedes ajustarlas.</p><div className="raw-preview"><p className="eyebrow">PRIMERAS FILAS</p><pre>{preview.rawRows.slice(0,5).map(row=>row.join(' | ')).join('\n')}</pre></div></section>}
   <details className="section import-mapping" open={!rows.length}><summary>{rows.length?'Cambiar columnas':'Mapear columnas del archivo'}</summary><MappingForm id={id} headers={preview.headers} categories={categories}/></details>
  </>}
 </>;
}
