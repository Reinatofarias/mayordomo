import {requireUser} from '@/data/supabase';
import {Navigation} from '@/components/navigation';
import {Brand} from '@/components/brand';
import {FloatingSupportWidget} from '@/components/floating-support-widget';

export const metadata={robots:{index:false,follow:false}};

export default async function PrivateLayout({children}:{children:React.ReactNode}){
 const {db,user}=await requireUser();
 const [{data:profile},{data:request}]=await Promise.all([
  db.from('profiles').select('locale').eq('id',user.id).maybeSingle(),
  db.from('support_requests').select('id').eq('user_id',user.id).eq('status','OPEN').ilike('subject','Chat de soporte%').order('created_at',{ascending:false}).limit(1).maybeSingle()
 ]);
 const locale=profile?.locale??'es-MX';const isPt=locale.startsWith('pt');
 const {data:messages}=request?await db.from('support_messages').select('id,sender,message,created_at').eq('user_id',user.id).eq('request_id',request.id).order('created_at',{ascending:true}).limit(20):{data:[]};
 return <div className="app-shell">
  <aside className="sidebar">
   <Brand href="/hoy" tagline={isPt?'Com sabedoria, todos os dias.':'Con sabiduría, cada día.'}/>
   <Navigation locale={locale}/>
   <p className="sidebar-note">{isPt?<><span>Administre com sabedoria.</span><br/><span>Viva com propósito.</span></>:<><span>Administra con sabiduría.</span><br/><span>Vive con propósito.</span></>}</p>
  </aside>
  <main id="contenido" className="app-content">{children}</main>
  <FloatingSupportWidget locale={locale} messages={messages??[]}/>
 </div>;
}