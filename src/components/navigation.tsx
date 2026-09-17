'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {House,ArrowLeftRight,ChartPie,MessageCircle,UserRound,Bell} from 'lucide-react';
const links=[{href:'/hoy',label:'Hoy',Icon:House},{href:'/movimientos',label:'Movimientos',Icon:ArrowLeftRight},{href:'/plan',label:'Plan',Icon:ChartPie},{href:'/notificaciones',label:'Avisos',Icon:Bell},{href:'/mayordomo',label:'MAYORDOMO',Icon:MessageCircle},{href:'/perfil',label:'Perfil',Icon:UserRound}];
export function Navigation(){const pathname=usePathname();return <nav aria-label="Navegacion principal" className="main-nav">{links.map(({href,label,Icon})=><Link key={href} href={href} aria-current={pathname.startsWith(href)?'page':undefined}><Icon size={21} aria-hidden="true"/><span>{label}</span></Link>)}</nav>;}