import {z} from 'zod';
import {notFound} from 'next/navigation';
import {getContext,getCategories,getTransactions,localMonth} from '@/data/finance';
import {MappingForm,ConfirmImport} from '@/components/import-forms';
import {displayMoney} from '@/i18n/es';
import {languageFromLocale,statusText,transactionKindText} from '@/i18n/app';
import {PrincipleCard} from '@/components/principle-card';

const previewSchema=z.object({
 headers:z.array(z.string()),
 rawRows:z.array(z.array(z.string())).default([]),
 rows:z.array(z.object({description:z.string(),occurred_at:z.string(),amount_minor:z.string(),currency:z.string(),kind:z.enum(['INCOME','EXPENSE']),category_id:z.string().optional()})).optional()
});

const copy={
 es:{eyebrow:'IMPORTACIÓN GUIADA',title:'Revisar importación',guideTitle:'Antes de guardar, mira la historia completa.',guideText:'Confirma fechas, importes y sentido de cada movimiento. La fidelidad en lo pequeño empieza con datos claros.',alreadyTitle:'Este archivo ya fue importado.',alreadyText:'No se duplicarán sus movimientos. Puedes revisar tus registros en Movimientos.',movements:'Movimientos',expenses:'Gastos',income:'Ingresos',dupes:'Posibles duplicados',dupeWarning:(count:number)=>`Detectamos ${count} posible(s) coincidencia(s) con movimientos de este mes. Revisa antes de confirmar.`,table:'Movimientos detectados',date:'Fecha',description:'Descripción',category:'Categoría sugerida',type:'Tipo',amount:'Importe',review:'Revisión',initial:'Categoría inicial',duplicate:'Posible duplicado',ready:'Lista',selectTitle:'Selecciona columnas',selectText:'Detectamos los encabezados del archivo. MAYORDOMO sugiere columnas automáticamente, pero puedes ajustarlas.',raw:'PRIMERAS FILAS',change:'Cambiar columnas',map:'Mapear columnas del archivo'},
 pt:{eyebrow:'IMPORTAÇÃO GUIADA',title:'Revisar importação',guideTitle:'Antes de salvar, veja a história completa.',guideText:'Confirme datas, valores e sentido de cada movimento. A fidelidade no pequeno começa com dados claros.',alreadyTitle:'Este arquivo já foi importado.',alreadyText:'Seus movimentos não serão duplicados. Você pode revisar os registros em Movimentos.',movements:'Movimentos',expenses:'Gastos',income:'Receitas',dupes:'Possíveis duplicados',dupeWarning:(count:number)=>`Detectamos ${count} possível(is) coincidência(s) com movimentos deste mês. Revise antes de confirmar.`,table:'Movimentos detectados',date:'Data',description:'Descrição',category:'Categoria sugerida',type:'Tipo',amount:'Valor',review:'Revisão',initial:'Categoria inicial',duplicate:'Possível duplicado',ready:'Pronta',selectTitle:'Selecione colunas',selectText:'Detectamos os cabeçalhos do arquivo. MAYORDOMO sugere colunas automaticamente, mas você pode ajustar.',raw:'PRIMEIRAS LINHAS',change:'Alterar colunas',map:'Mapear colunas do arquivo'}
};

export default async function Review({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const c=await getContext();const t=copy[languageFromLocale(c.profile.locale)];
 const [{data,error},categories,existing,{data:principle}]=await Promise.all([
  c.db.from('import_jobs').select('file_name,status,preview').eq('user_id',c.user.id).eq('id',id).single(),
  getCategories(c),
  getTransactions(c,localMonth(c.profile.timezone)),
  c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','responsabilidad').eq('active',true).single()
 ]);
 if(error||!data)notFound();const preview=previewSchema.parse(data.preview);const categoryNames=new Map(categories.map(category=>[category.id,category.name]));
 const duplicates=new Set(existing.map(row=>`${row.occurredAt}:${row.amountMinor}:${row.currency}:${row.kind}`));
 const rows=preview.rows??[];const income=rows.filter(row=>row.kind==='INCOME'),expenses=rows.filter(row=>row.kind==='EXPENSE');
 const duplicateCount=rows.filter(row=>duplicates.has(`${row.occurred_at}:${row.amount_minor}:${row.currency}:${row.kind}`)).length;
 return <>
  <header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{data.file_name} · {statusText(data.status,c.profile.locale)}</p></header>
  <section className="import-guidance"><div><h2>{t.guideTitle}</h2><p>{t.guideText}</p></div>{principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}</section>
  {data.status==='IMPORTED'?<section className="empty"><h2>{t.alreadyTitle}</h2><p>{t.alreadyText}</p></section>:<>
   {rows.length?<>
    <dl className="metric-grid import-summary"><div><dt>{t.movements}</dt><dd>{rows.length}</dd></div><div><dt>{t.expenses}</dt><dd>{expenses.length}</dd></div><div><dt>{t.income}</dt><dd>{income.length}</dd></div><div><dt>{t.dupes}</dt><dd>{duplicateCount}</dd></div></dl>
    {duplicateCount>0&&<p className="status-warning">{t.dupeWarning(duplicateCount)}</p>}
    <div className="import-preview-table" role="region" aria-label={t.table} tabIndex={0}><table><thead><tr><th>{t.date}</th><th>{t.description}</th><th>{t.category}</th><th>{t.type}</th><th>{t.amount}</th><th>{t.review}</th></tr></thead><tbody>{rows.map((row,index)=>{const duplicated=duplicates.has(`${row.occurred_at}:${row.amount_minor}:${row.currency}:${row.kind}`);return <tr key={index} data-warning={duplicated||undefined}><td>{row.occurred_at}</td><td>{row.description}</td><td>{categoryNames.get(row.category_id??'')??t.initial}</td><td>{transactionKindText(row.kind,c.profile.locale)}</td><td>{displayMoney(row.amount_minor,row.currency,c.profile.locale)}</td><td>{duplicated?t.duplicate:t.ready}</td></tr>;})}</tbody></table></div>
    <ConfirmImport id={id} count={rows.length} locale={c.profile.locale}/>
   </>:<section className="section"><h2>{t.selectTitle}</h2><p>{t.selectText}</p><div className="raw-preview"><p className="eyebrow">{t.raw}</p><pre>{preview.rawRows.slice(0,5).map(row=>row.join(' | ')).join('\n')}</pre></div></section>}
   <details className="section import-mapping" open={!rows.length}><summary>{rows.length?t.change:t.map}</summary><MappingForm id={id} headers={preview.headers} categories={categories} locale={c.profile.locale}/></details>
  </>}
 </>;
}