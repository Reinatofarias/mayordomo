import {requireUser} from '@/data/supabase';
import {Navigation} from '@/components/navigation';
import {Brand} from '@/components/brand';

export const metadata={robots:{index:false,follow:false}};

export default async function PrivateLayout({children}:{children:React.ReactNode}){
 await requireUser();
 return <div className="app-shell">
  <aside className="sidebar">
   <Brand href="/hoy" tagline="Con sabiduría, cada día."/>
   <Navigation/>
   <p className="sidebar-note">Administra con sabiduría.<br/>Vive con propósito.</p>
  </aside>
  <main id="contenido" className="app-content">{children}</main>
 </div>;
}
