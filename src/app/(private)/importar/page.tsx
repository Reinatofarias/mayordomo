import {getContext} from '@/data/finance';
import {languageFromLocale} from '@/i18n/app';
import {UploadForm} from '@/components/import-forms';

const copy={
 es:{eyebrow:'TU HISTORIA, EN UN LUGAR',title:'Subir extracto',intro:'Prepara una vista previa, revisa columnas y confirma solo cuando todo esté claro.',guideTitle:'Importa sin perder el control.',guideText:'El archivo se usa para detectar movimientos. Nada se guarda como transacción hasta que confirmes la vista previa.',best:'Buenas prácticas',bestText:'Usa fechas AAAA-MM-DD, importes con punto decimal y evita mezclar monedas.',small:'Los archivos originales no se conservan.'},
 pt:{eyebrow:'SUA HISTÓRIA, EM UM LUGAR',title:'Subir extrato',intro:'Prepare uma prévia, revise colunas e confirme somente quando tudo estiver claro.',guideTitle:'Importe sem perder o controle.',guideText:'O arquivo é usado para detectar movimentos. Nada é salvo como transação até você confirmar a prévia.',best:'Boas práticas',bestText:'Use datas AAAA-MM-DD, valores com ponto decimal e evite misturar moedas.',small:'Os arquivos originais não são conservados.'}
};

export default async function ImportPage(){const c=await getContext();const t=copy[languageFromLocale(c.profile.locale)];return <><header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header><section className="import-guidance"><div><h2>{t.guideTitle}</h2><p>{t.guideText}</p></div><div className="principle-card"><h3>{t.best}</h3><p>{t.bestText}</p><small>{t.small}</small></div></section><UploadForm locale={c.profile.locale}/></>;}