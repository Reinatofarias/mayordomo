import {parseMoney} from './money.ts';
export function parseCsv(source:string,delimiter= ','):string[][]{
 if(source.length>1000000)throw new Error('Archivo demasiado grande.');
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
 const input=source.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){
 const char=input[i];
 if(quoted){if(char==='"'){if(input[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=char;}
 else if(char==='"'&&field===''&&!closed)quoted=true;
 else if(char===delimiter){row.push(field);field='';closed=false;}
 else if(char==='\n'||char==='\r'){if(char==='\r'&&input[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';closed=false;}
 else{if(closed||char==='"')throw new Error('CSV no válido.');field+=char;}
 if(field.length>5000||row.length>30||rows.length>500)throw new Error('El archivo supera los límites de importación.');
 }
 if(quoted)throw new Error('CSV incompleto.');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2||rows.length>501)throw new Error('Incluye encabezados y entre 1 y 500 movimientos.');
 if(rows.some(r=>r.length!==rows[0].length))throw new Error('Todas las filas deben tener las mismas columnas.');
 return rows;
}
export type ImportRow={description:string;merchant:string;occurred_at:string;amount_minor:string;currency:string;kind:'INCOME'|'EXPENSE';category_id:string};
export function mapImport(rows:string[][],mapping:{description:number;date:number;amount:number;kind:'INCOME'|'EXPENSE'|'SIGNED';categoryId:string;currency:string}):ImportRow[]{
 return rows.map((row,index)=>{
 const description=row[mapping.description]?.trim(),date=row[mapping.date]?.trim(),value=row[mapping.amount]?.trim();
 if(!description||description.length>250||!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||!value)throw new Error('Revisa la fila '+(index+2)+'. Usa fechas AAAA-MM-DD.');
 const amount=parseMoney(value,mapping.currency).amountMinor;if(amount===0n)throw new Error('El importe no puede ser cero en la fila '+(index+2)+'.');
 return {description,merchant:'',occurred_at:date,amount_minor:(amount<0n?-amount:amount).toString(),currency:mapping.currency,kind:mapping.kind==='SIGNED'?(amount<0n?'EXPENSE':'INCOME'):mapping.kind,category_id:mapping.categoryId};
 });
}
