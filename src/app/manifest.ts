import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{return {name:'MAYORDOMO',short_name:'MAYORDOMO',description:'Administra con sabiduría. Vive con propósito.',lang:'es',start_url:'/hoy',scope:'/',display:'standalone',background_color:'#f6f5ef',theme_color:'#173e32',icons:[{src:'/api/icons/192',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/api/icons/512',sizes:'512x512',type:'image/png',purpose:'maskable'}]};}

