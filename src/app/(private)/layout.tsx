import Link from 'next/link';
import {requireUser} from '@/data/supabase';
import {Navigation} from '@/components/navigation';
export const metadata={robots:{index:false,follow:false}};
export default async function PrivateLayout({children}:{children:React.ReactNode}){
 await requireUser();return <div className="app-shell"><aside className="sidebar"><Link className="brand" href="/hoy">MAYORDOMO<span>Con sabiduría, cada día.</span></Link><Navigation/><p className="sidebar-note">Administra con sabiduría.<br/>Vive con propósito.</p></aside><main id="contenido" className="app-content">{children}</main></div>;
}
