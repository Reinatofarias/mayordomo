import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/privacidad','/terminos','/soporte'],disallow:['/hoy','/movimientos','/plan','/mayordomo','/perfil','/bienvenida','/importar','/informe','/api','/auth','/recuperar','/acceso']}};}

