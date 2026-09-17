'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {House,ArrowLeftRight,ChartPie,MessageCircle,UserRound,Bell} from 'lucide-react';

const labels={
 es:{home:'Hoy',transactions:'Movimientos',plan:'Plan',notices:'Avisos',profile:'Perfil',nav:'Navegación principal'},
 pt:{home:'Hoje',transactions:'Movimentos',plan:'Plano',notices:'Avisos',profile:'Perfil',nav:'Navegação principal'}
};

export function Navigation({locale='es-MX'}:{locale?:string}){
 const pathname=usePathname();
 const t=locale.startsWith('pt')?labels.pt:labels.es;
 const links=[{href:'/hoy',label:t.home,Icon:House},{href:'/movimientos',label:t.transactions,Icon:ArrowLeftRight},{href:'/plan',label:t.plan,Icon:ChartPie},{href:'/notificaciones',label:t.notices,Icon:Bell},{href:'/mayordomo',label:'MAYORDOMO',Icon:MessageCircle},{href:'/perfil',label:t.profile,Icon:UserRound}];
 return <nav aria-label={t.nav} className="main-nav">{links.map(({href,label,Icon})=><Link key={href} href={href} aria-current={pathname.startsWith(href)?'page':undefined}><Icon size={21} aria-hidden="true"/><span>{label}</span></Link>)}</nav>;
}