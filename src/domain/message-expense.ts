import {parseMoney,serializeMoney} from './money.ts';
export function proposeTextExpense(text:string,currency:string){
 const match=/^gast[eé]\s+(\d+(?:\.\d+)?)\s*(?:pesos|d[oó]lares)?\s+en\s+(.{1,100})$/i.exec(text.trim());
 if(!match)return null;
 const amount=parseMoney(match[1],currency);if(amount.amountMinor<=0n)return null;
 return {amount:serializeMoney(amount),merchant:match[2].trim(),categorySuggestion:/uber|taxi|cabify/i.test(match[2])?'Transporte':'Otros',confidence:'REVIEW_REQUIRED',requiresConfirmation:true as const};
}

