import 'server-only';
import type {getContext} from '@/data/finance';

type Context=Awaited<ReturnType<typeof getContext>>;
export type InternalNotification={id:string;title:string;message:string;kind:'stored'|'action'|'warning'|'access';createdAt?:string};

export async function getInternalNotifications(c:Context,{hasRows,net,reserve,debt}:{hasRows:boolean;net:bigint;reserve:bigint;debt:bigint}){
 const {data}=await c.db.from('notifications').select('id,message,created_at').eq('user_id',c.user.id).is('read_at',null).order('created_at',{ascending:false}).limit(5);
 const items:InternalNotification[]=(data??[]).map(item=>({id:item.id,title:'Notificación',message:item.message,kind:'stored',createdAt:item.created_at}));
 if(!hasRows)items.push({id:'first-movement',title:'Primer paso pendiente',message:'Registra al menos un movimiento para que MAYORDOMO pueda mostrar patrones reales.',kind:'action'});
 if(hasRows&&net<0n)items.push({id:'negative-net',title:'Atención al margen del mes',message:'Tus gastos registrados superan tus ingresos registrados. Revisa antes de asumir nuevos compromisos.',kind:'warning'});
 if(reserve===0n)items.push({id:'reserve-empty',title:'Reserva por construir',message:'Considera una reserva pequeña y realista cuando tus necesidades básicas estén cubiertas.',kind:'action'});
 if(debt>0n)items.push({id:'debt-review',title:'Revisión de deuda',message:'Tienes deuda inicial registrada. Revisa saldo, pago mensual y fecha de vencimiento en Plan.',kind:'warning'});
 return items.slice(0,6);
}
