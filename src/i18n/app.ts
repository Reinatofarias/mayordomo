export type AppLanguage='es'|'pt';

export function languageFromLocale(locale:string|undefined|null):AppLanguage{
 return locale?.toLowerCase().startsWith('pt')?'pt':'es';
}

export function isPortuguese(locale:string|undefined|null){return languageFromLocale(locale)==='pt';}

export function formatDateTime(value:string|Date,locale='es-MX'){
 return new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'}).format(typeof value==='string'?new Date(value):value);
}

export function formatDate(value:string|Date,locale='es-MX'){
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(typeof value==='string'?new Date(value):value);
}

export function statusText(status:string,locale='es-MX'){
 const pt:Record<string,string>={OPEN:'Aberto',RESOLVED:'Resolvido',CLOSED:'Fechado',REVIEW_REQUIRED:'Revisão necessária',IMPORTED:'Importado',UPLOADED:'Enviado'};
 const es:Record<string,string>={OPEN:'Abierto',RESOLVED:'Resuelto',CLOSED:'Cerrado',REVIEW_REQUIRED:'Revisión necesaria',IMPORTED:'Importado',UPLOADED:'Subido'};
 return (isPortuguese(locale)?pt:es)[status]??status;
}

export function transactionKindText(kind:string,locale='es-MX'){
 if(isPortuguese(locale))return kind==='INCOME'?'Receita':'Gasto';
 return kind==='INCOME'?'Ingreso':'Gasto';
}

export function transactionSourceText(source:string,locale='es-MX'){
 const pt:Record<string,string>={MANUAL:'Manual',IMPORT:'Importação',WHATSAPP:'WhatsApp',BANK:'Banco',RECEIPT:'Recibo'};
 const es:Record<string,string>={MANUAL:'Manual',IMPORT:'Importación',WHATSAPP:'WhatsApp',BANK:'Banco',RECEIPT:'Recibo'};
 return (isPortuguese(locale)?pt:es)[source]??source;
}

export function budgetStatusText(status:string,locale='es-MX'){
 const pt:Record<string,string>={'Necesitas actuar':'Precisa agir','Atención':'Atenção','Bajo control':'Sob controle'};
 return isPortuguese(locale)?pt[status]??status:status;
}

export const commonCopy={
 es:{other:'Otros',none:'Sin datos',filter:'Filtrar',search:'Buscar',month:'Mes',category:'Categoría',type:'Tipo',all:'Todas',allMasc:'Todos',income:'Ingresos',expenses:'Gastos',expense:'Gasto',loading:'Cargando…',save:'Guardar',saving:'Guardando…',optional:'Opcional',editOrDelete:'Editar o eliminar'},
 pt:{other:'Outros',none:'Sem dados',filter:'Filtrar',search:'Buscar',month:'Mês',category:'Categoria',type:'Tipo',all:'Todas',allMasc:'Todos',income:'Receitas',expenses:'Gastos',expense:'Gasto',loading:'Carregando…',save:'Salvar',saving:'Salvando…',optional:'Opcional',editOrDelete:'Editar ou excluir'}
} as const;

export function common(locale:string){return commonCopy[languageFromLocale(locale)];}