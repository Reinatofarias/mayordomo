import { money, serializeMoney, ratioBasisPoints } from './money.ts';
export type Transaction={id:string;amountMinor:string;currency:string;kind:'INCOME'|'EXPENSE';occurredAt:string;categoryId:string;merchant:string;description:string};
export function totals(transactions:Transaction[],currency:string) {
 let income=0n,expenses=0n;
 for(const t of transactions){if(t.currency!==currency)continue;const amount=BigInt(t.amountMinor);if(amount<=0n)throw new Error('Importe no válido.');if(t.kind==='INCOME')income+=amount;else expenses+=amount;}
 return {income:serializeMoney(money(income,currency)),expenses:serializeMoney(money(expenses,currency)),net:serializeMoney(money(income-expenses,currency))};
}
export function initialSnapshot(income:bigint,fixed:bigint,debt:bigint,reserve:bigint,currency:string){
 const available=income-fixed;
 return {basis:'ESTIMATE',income:serializeMoney(money(income,currency)),committed:serializeMoney(money(fixed,currency)),available:serializeMoney(money(available,currency)),debt:serializeMoney(money(debt,currency)),reserve:serializeMoney(money(reserve,currency)),status:available<0n?'Necesitas actuar':available*10n<income?'Atención':'Bajo control'};
}
export function budgetStatus(spent:bigint,limit:bigint){
 return {remainingMinor:(limit-spent).toString(),usedBasisPoints:ratioBasisPoints(spent,limit)?.toString()??null,status:spent>limit?'Necesitas actuar':spent*10n>=limit*9n?'Atención':'Bajo control'};
}
export function projection(spent:bigint,elapsedDays:number,totalDays:number){
 if(!Number.isInteger(elapsedDays)||!Number.isInteger(totalDays)||elapsedDays<1||elapsedDays>totalDays||totalDays>31)throw new Error('Período no válido.');
 return (spent*BigInt(totalDays)/BigInt(elapsedDays)).toString();
}
export function byCategory(transactions:Transaction[],currency:string){
 const result:Record<string,string>={};
 for(const t of transactions.filter(t=>t.currency===currency&&t.kind==='EXPENSE'))result[t.categoryId]=(BigInt(result[t.categoryId]??'0')+BigInt(t.amountMinor)).toString();
 return result;
}
export function duplicates(transactions:Transaction[]){
 const seen=new Map<string,string>();const pairs:{first:string;second:string}[]=[];
 for(const t of transactions){const merchant=t.merchant.trim().toLowerCase();if(!merchant)continue;const key=[t.currency,t.kind,t.amountMinor,t.occurredAt,merchant].join('|');const first=seen.get(key);if(first)pairs.push({first,second:t.id});else seen.set(key,t.id);}
 return pairs;
}
export function recurring(transactions:Transaction[]){
 const groups=new Map<string,Transaction[]>();
 for(const t of transactions){if(t.kind!=='EXPENSE'||!t.merchant.trim())continue;const k=[t.currency,t.amountMinor,t.merchant.trim().toLowerCase()].join('|');groups.set(k,[...(groups.get(k)??[]),t]);}
 return [...groups.values()].filter(rows=>new Set(rows.map(t=>t.occurredAt.slice(0,7))).size>=3).map(rows=>({merchant:rows[0].merchant,amountMinor:rows[0].amountMinor,currency:rows[0].currency,observations:rows.length,label:'Posible gasto recurrente'}));
}
export function anomalies(current:Transaction[],previous:Transaction[],currency:string){
 const now=byCategory(current,currency),before=byCategory(previous,currency);
 return Object.entries(now).filter(([id,amount])=>BigInt(before[id]??'0')>0n&&BigInt(amount)*100n>BigInt(before[id])*130n).map(([categoryId,amountMinor])=>({categoryId,amountMinor,previousMinor:before[categoryId]}));
}

export function progressValue(current:string,target:string):number {
 const ratio=ratioBasisPoints(BigInt(current),BigInt(target))??0n;
 return Number(ratio<0n?0n:ratio>10000n?10000n:ratio);
}