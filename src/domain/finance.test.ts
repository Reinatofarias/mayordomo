import { test } from 'node:test';
import assert from 'node:assert/strict';
import {totals,initialSnapshot,budgetStatus,projection,duplicates,byCategory,anomalies,type Transaction} from './finance.ts';
const row:Transaction={id:'1',amountMinor:'100',currency:'MXN',kind:'EXPENSE',occurredAt:'2026-09-01',categoryId:'food',merchant:'Tienda',description:'Compra'};
test('totals separate currencies and preserve exact amounts',()=>{
 const result=totals([row,{...row,id:'2',amountMinor:'500',kind:'INCOME'},{...row,id:'3',currency:'USD',amountMinor:'999'}],'MXN');
 assert.equal(result.net.amountMinor,'400');assert.equal(result.expenses.amountMinor,'100');
});
test('snapshots distinguish negative available funds and estimates',()=>{assert.equal(initialSnapshot(100n,200n,300n,0n,'MXN').status,'Necesitas actuar');});
test('budgets identify exact limits and projection uses calendar days',()=>{
 assert.equal(budgetStatus(91n,100n).status,'Atención');assert.equal(budgetStatus(101n,100n).remainingMinor,'-1');
 assert.equal(projection(100n,10,30),'300');assert.throws(()=>projection(100n,0,30));
});
test('duplicate candidates do not cross currencies or income and expense',()=>{
 assert.equal(duplicates([row,{...row,id:'2'},{...row,id:'3',currency:'USD'},{...row,id:'4',kind:'INCOME'}]).length,1);
 assert.equal(byCategory([row],'MXN').food,'100');
 assert.equal(anomalies([{...row,amountMinor:'150'}],[row],'MXN').length,1);
});
