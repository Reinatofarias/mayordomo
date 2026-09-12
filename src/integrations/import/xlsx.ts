import 'server-only';
import {inflateRawSync} from 'node:zlib';
import {readSheet} from 'read-excel-file/node';
export async function parseXlsx(buffer:Buffer):Promise<string[][]>{
 if(buffer.length>1000000||buffer.length<22)throw new Error('Archivo no válido.');
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--){if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}}
 if(end<0)throw new Error('XLSX no válido.');
 const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),total=0;
 if(count>128||count===0)throw new Error('Archivo demasiado complejo.');
 for(let i=0;i<count;i++){
 if(offset+46>buffer.length||buffer.readUInt32LE(offset)!==0x02014b50)throw new Error('XLSX no válido.');
 const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10),compressed=buffer.readUInt32LE(offset+20),size=buffer.readUInt32LE(offset+24),nameLength=buffer.readUInt16LE(offset+28),extraLength=buffer.readUInt16LE(offset+30),commentLength=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
 if(flags&1||![0,8].includes(method)||size>5000000||local+30>buffer.length)throw new Error('XLSX no compatible.');
 if(buffer.readUInt32LE(local)!==0x04034b50)throw new Error('XLSX no válido.');
 const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
 if(start+compressed>buffer.length)throw new Error('XLSX incompleto.');
 const data=buffer.subarray(start,start+compressed),expanded=method===8?inflateRawSync(data,{maxOutputLength:5000000}):data;
 if(expanded.length!==size)throw new Error('XLSX no válido.');total+=expanded.length;if(total>15000000)throw new Error('Archivo demasiado grande.');
 offset+=46+nameLength+extraLength+commentLength;
 }
 const rows=await readSheet(buffer,1,{parseNumber:value=>value});
 if(rows.length<2||rows.length>501||rows.some(row=>row.length>30))throw new Error('Incluye entre 1 y 500 movimientos y hasta 30 columnas.');
 return rows.map(row=>row.map(value=>value instanceof Date?value.toISOString().slice(0,10):String(value??'')));
}
