import 'server-only';
import type {getContext} from '@/data/finance';

type Context=Awaited<ReturnType<typeof getContext>>;
export type InternalNotification={id:string;title:string;message:string;kind:'stored'|'action'|'warning'|'access';createdAt?:string;dismissible?:boolean};

export async function getInternalNotifications(c:Context,{hasRows,net,reserve,debt,limit=6}:{hasRows:boolean;net:bigint;reserve:bigint;debt:bigint;limit?:number}){
 const [{data},{data:dismissed}]=await Promise.all([
  c.db.from('notifications').select('id,message,created_at').eq('user_id',c.user.id).is('read_at',null).order('created_at',{ascending:false}).limit(Math.max(5,limit)),
  c.db.from('notification_dismissals').select('key').eq('user_id',c.user.id)
 ]);
 const dismissedKeys=new Set((dismissed??[]).map(item=>item.key));
 const items:InternalNotification[]=(data??[]).map(item=>({id:item.id,title:'Notificacion',message:item.message,kind:'stored',createdAt:item.created_at,dismissible:false}));
 const derived:InternalNotification[]=[];
 if(!hasRows)derived.push({id:'first-movement',title:'Primer paso pendiente',message:'Registra al menos un movimiento para que MAYORDOMO pueda mostrar patrones reales.',kind:'action',dismissible:true});
 if(hasRows&&net<0n)derived.push({id:'negative-net',title:'Atencion al margen del mes',message:'Tus gastos registrados superan tus ingresos registrados. Revisa antes de asumir nuevos compromisos.',kind:'warning',dismissible:true});
 if(reserve===0n)derived.push({id:'reserve-empty',title:'Reserva por construir',message:'Considera una reserva pequena y realista cuando tus necesidades basicas esten cubiertas.',kind:'action',dismissible:true});
 if(debt>0n)derived.push({id:'debt-review',title:'Revision de deuda',message:'Tienes deuda inicial registrada. Revisa saldo, pago mensual y fecha de vencimiento en Plan.',kind:'warning',dismissible:true});
 items.push(...derived.filter(item=>!dismissedKeys.has(item.id)));
 return items.slice(0,limit);
}