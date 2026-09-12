import 'server-only';
export async function readJson(request:Request,maxBytes=16000):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)throw new Error('Solicitud vacía.');
 const chunks:Uint8Array[]=[];let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>maxBytes){await reader.cancel();throw new Error('Solicitud demasiado grande.');}chunks.push(value);}
 const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(process.env.APP_URL!).origin;}
