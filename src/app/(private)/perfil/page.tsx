import Link from 'next/link';
import {getContext} from '@/data/finance';
import {hasProductAccess,hotmartCheckoutUrl} from '@/data/access';
import {signOut} from '@/app/auth-actions';
import {refreshHotmartAccess} from '@/app/acceso/pendiente/actions';
import {ProfileForm} from '@/components/profile-form';
import {Button} from '@/components/ui/button';
import {PrincipleCard} from '@/components/principle-card';
import {displayMoney} from '@/i18n/es';

function formatDate(value:string|null|undefined,locale:string){
 if(!value)return locale.startsWith('pt')?'Nao disponivel':'No disponible';
 return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(value));
}

const copy={pt:{eyebrow:'CENTRO DE MORDOMIA',fallbackName:'Seu perfil',context:'SEU CONTEXTO',heroTitle:'Uma experiencia financeira guiada por proposito.',heroText:'MAYORDOMO usa seu perfil para organizar dados, sugerir proximos passos e lembrar principios biblicos sem pressao nem culpa.',country:'Pais',currency:'Moeda',access:'Acesso',active:'Ativo',pending:'Pendente',income:'Renda estimada',fixed:'Gastos fixos',reserve:'Reserva',personal:'Dados pessoais',personalText:'Atualize pais, moeda, idioma e fuso horario para que relatorios e novos registros usem o formato correto.',registered:'Dados registrados',moves:'Movimentos',plan:'Plano',support:'Suporte',registeredHint:'Esses numeros mostram registros reais criados por voce: movimentos, orcamentos/metas/dividas e solicitacoes de suporte.',billing:'Faturamento e acesso',accessWarn:'Seu acesso ao produto ainda nao esta ativo. Se ja comprou, revise o acesso com o mesmo e-mail da Hotmart.',provider:'Provedor',status:'Estado',purchase:'Compra',renewal:'Renovacao',accessUntil:'Acesso ate',manage:'Administrar na Hotmart',noSubscription:'Nao ha assinatura registrada para este e-mail.',checkHotmart:'Revisar acesso Hotmart',buy:'Comprar acesso',billingHint:'Para cancelar ou alterar dados de pagamento, use o portal da Hotmart. Se comprou com outro e-mail, solicite suporte.',askHelp:'Solicitar ajuda ->',supportTitle:'Suporte',supportText:'Use o botao flutuante de ajuda no canto inferior. Primeiro voce vera duvidas frequentes e respostas preparadas; se ainda precisar de ajuda, o Gemini responde antes de escalar para humano.',recent:'Solicitacoes recentes',received:'Recebida',noSupport:'Voce ainda nao tem solicitacoes registradas.',logout:'Sair'},es:{eyebrow:'CENTRO DE MAYORDOMIA',fallbackName:'Tu perfil',context:'TU CONTEXTO',heroTitle:'Una experiencia financiera guiada por proposito.',heroText:'MAYORDOMO usa tu perfil para ordenar los datos, sugerir proximos pasos y recordar principios biblicos sin presion ni culpa.',country:'Pais',currency:'Moneda',access:'Acceso',active:'Activo',pending:'Pendiente',income:'Ingreso estimado',fixed:'Gastos fijos',reserve:'Reserva',personal:'Datos personales',personalText:'Actualiza pais, moneda, idioma y zona horaria para que los reportes se muestren con el formato correcto.',registered:'Datos registrados',moves:'Movimientos',plan:'Plan',support:'Soporte',registeredHint:'Estos numeros muestran registros reales creados por ti: movimientos, presupuestos/metas/deudas y solicitudes de soporte.',billing:'Facturacion y acceso',accessWarn:'Tu acceso de producto todavia no esta activo. Si ya compraste, revisa el acceso con el mismo correo de Hotmart.',provider:'Proveedor',status:'Estado',purchase:'Compra',renewal:'Renovacion',accessUntil:'Acceso hasta',manage:'Administrar en Hotmart',noSubscription:'No hay una suscripcion registrada para este correo.',checkHotmart:'Revisar acceso Hotmart',buy:'Comprar acceso',billingHint:'Para cancelar o cambiar datos de pago, usa el portal de Hotmart. Si compraste con otro correo, solicita soporte.',askHelp:'Solicitar ayuda ->',supportTitle:'Soporte',supportText:'Usa el boton flotante de ayuda en la esquina inferior. Primero veras dudas frecuentes y respuestas preparadas; si aun necesitas ayuda, el Gemini responde antes de escalar a humano.',recent:'Solicitudes recientes',received:'Recibida',noSupport:'Aun no tienes solicitudes registradas.',logout:'Cerrar sesion'}};

export default async function Profile(){
 const c=await getContext(false);const t=c.profile.locale.startsWith('pt')?copy.pt:copy.es;
 const checkout=hotmartCheckoutUrl();
 const [access,{data:subscriptions},{data:requests},{data:principle},{count:transactionCount},{count:budgetCount},{count:goalCount},{count:debtCount},{count:supportCount}]=await Promise.all([
  hasProductAccess(c.db),
  c.db.from('subscriptions').select('id,provider,plan,status,purchased_at,renewal_at,access_until').eq('user_id',c.user.id).order('created_at',{ascending:false}),
  c.db.from('support_requests').select('id,subject,status,created_at').eq('user_id',c.user.id).order('created_at',{ascending:false}).limit(10),
  c.db.from('biblical_principles').select('reference,principle,application,risk_context').eq('theme','mayordomÃ­a').eq('active',true).single(),
  c.db.from('transactions').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('budgets').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('goals').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('debts').select('id',{count:'exact',head:true}).eq('user_id',c.user.id),
  c.db.from('support_requests').select('id',{count:'exact',head:true}).eq('user_id',c.user.id)
 ]);
 const monthlyIncome=displayMoney(c.profile.monthly_income_minor,c.profile.currency,c.profile.locale);
 const fixedExpenses=displayMoney(c.profile.fixed_expenses_minor,c.profile.currency,c.profile.locale);
 const reserve=displayMoney(c.profile.reserve_minor,c.profile.currency,c.profile.locale);
 const planItems=(budgetCount??0)+(goalCount??0)+(debtCount??0);
 return <>
  <header className="page-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{c.profile.name||t.fallbackName}</h1><p>{c.user.email}</p></header>
  <section className="profile-hero">
   <div><p className="eyebrow">{t.context}</p><h2>{t.heroTitle}</h2><p>{t.heroText}</p></div>
   {principle&&<PrincipleCard reference={principle.reference} principle={principle.principle} application={principle.application} riskContext={principle.risk_context}/>}
  </section>
  <dl className="metric-grid profile-metrics"><div><dt>{t.country}</dt><dd>{c.profile.country}</dd></div><div><dt>{t.currency}</dt><dd>{c.profile.currency}</dd></div><div><dt>{t.access}</dt><dd>{access?t.active:t.pending}</dd></div><div><dt>{t.income}</dt><dd>{monthlyIncome}</dd></div><div><dt>{t.fixed}</dt><dd>{fixedExpenses}</dd></div><div><dt>{t.reserve}</dt><dd>{reserve}</dd></div></dl>
  <section className="section profile-sections"><article><h2>{t.personal}</h2><p>{t.personalText}</p><ProfileForm profile={{name:c.profile.name,phone:c.profile.phone,country:c.profile.country,currency:c.profile.currency,locale:c.profile.locale,timezone:c.profile.timezone}}/></article><article><h2>{t.registered}</h2><dl className="usage-breakdown"><div><dt>{t.moves}</dt><dd>{transactionCount??0}</dd></div><div><dt>{t.plan}</dt><dd>{planItems}</dd></div><div><dt>{t.support}</dt><dd>{supportCount??0}</dd></div></dl><p className="hint">{t.registeredHint}</p></article></section>
  <section className="section"><h2>{t.billing}</h2>{!access&&<p className="status-warning">{t.accessWarn}</p>}{subscriptions?.length?subscriptions.map(s=><article key={s.id} className="billing-card"><h3>{s.plan}</h3><p>{t.provider}: {s.provider} Â· {t.status}: {s.status}</p><p>{t.purchase}: {formatDate(s.purchased_at,c.profile.locale)}<br/>{t.renewal}: {formatDate(s.renewal_at,c.profile.locale)}<br/>{t.accessUntil}: {formatDate(s.access_until,c.profile.locale)}</p><Button asChild variant="outline"><a href="https://consumer.hotmart.com/" target="_blank" rel="noopener noreferrer">{t.manage}</a></Button></article>):<p>{t.noSubscription}</p>}<div className="page-actions"><form action={refreshHotmartAccess}><Button variant="outline">{t.checkHotmart}</Button></form>{checkout&&<Button asChild><a href={checkout} target="_blank" rel="noopener noreferrer">{t.buy}</a></Button>}</div><p className="hint">{t.billingHint}</p><Link href="#soporte">{t.askHelp}</Link></section>
  <section className="section" id="soporte"><h2>{t.supportTitle}</h2><p>{t.supportText}</p>{requests?.length?<div className="support-history"><h3>{t.recent}</h3>{requests.map(r=><article key={r.id}><strong>{r.subject}</strong><span>{r.status==='OPEN'?t.received:r.status} Â· {formatDate(r.created_at,c.profile.locale)}</span></article>)}</div>:<p className="hint">{t.noSupport}</p>}</section>
  <section className="section"><form action={signOut}><Button variant="outline">{t.logout}</Button></form></section>
 </>;
}