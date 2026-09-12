import {ImageResponse} from 'next/og';
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size}=await params;if(size!=='192'&&size!=='512')return new Response(null,{status:404});const pixels=Number(size);
 return new ImageResponse(<div style={{display:'flex',height:'100%',width:'100%',alignItems:'center',justifyContent:'center',background:'#173e32',color:'#f6f5ef',fontSize:pixels*.46,fontWeight:700}}>M</div>,{width:pixels,height:pixels,headers:{'Cache-Control':'public, max-age=86400'}});
}

