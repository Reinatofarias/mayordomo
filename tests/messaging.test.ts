import {test} from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
import {WhatsAppProvider} from '../src/integrations/messaging/whatsapp.ts';
import {proposeTextExpense} from '../src/domain/message-expense.ts';
test('WhatsApp verifies exact raw bytes and normalizes messages',()=>{
 const provider=new WhatsAppProvider('test-secret');const payload={object:'whatsapp_business_account',entry:[{changes:[{value:{messages:[{id:'wamid.1',from:'5215555555555',timestamp:'1700000000',type:'text',text:{body:'Gasté 250 pesos en Uber'}}]}}]}]};
 const raw=Buffer.from(JSON.stringify(payload)),signature='sha256='+createHmac('sha256','test-secret').update(raw).digest('hex');
 assert.equal(provider.verify(raw,signature),true);assert.equal(provider.verify(Buffer.concat([raw,Buffer.from(' ')]),signature),false);assert.equal(provider.verify(raw,null),false);
 assert.equal(provider.normalize(payload)[0].text,'Gasté 250 pesos en Uber');
});
test('message parsing proposes expenses but never confirms or persists them',()=>{
 const proposal=proposeTextExpense('Gasté 250 pesos en Uber','MXN');assert.equal(proposal?.amount.amountMinor,'25000');assert.equal(proposal?.requiresConfirmation,true);assert.equal(proposal?.categorySuggestion,'Transporte');assert.equal(proposeTextExpense('No sé cuánto gasté','MXN'),null);
});

