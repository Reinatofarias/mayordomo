export type Institution={id:string;name:string;country:string};
export type BankConnection={id:string;status:'PENDING'|'CONNECTED'|'DISCONNECTED'|'UNAVAILABLE'|'MOCK';mode:'LIVE'|'DEVELOPMENT'};
export interface FinancialDataProvider{
 getInstitutions(country:string):Promise<Institution[]>;
 createConnection(userId:string,institutionId:string):Promise<BankConnection>;
 getConnectionStatus(connectionId:string):Promise<BankConnection>;
 syncAccounts(connectionId:string):Promise<{externalId:string;name:string;currency:string}[]>;
 syncTransactions(connectionId:string):Promise<{externalId:string;amountMinor:string;currency:string;occurredAt:string}[]>;
 disconnect(connectionId:string):Promise<void>;
}
export class MockFinancialDataProvider implements FinancialDataProvider{
 constructor(){if(process.env.NODE_ENV==='production')throw new Error('Mock banking is disabled in production');}
 async getInstitutions(country:string){return [{id:'mock-only',name:'Banco ficticio · desarrollo',country}];}
 async createConnection(){return {id:'mock-connection',status:'MOCK' as const,mode:'DEVELOPMENT' as const};}
 async getConnectionStatus(connectionId:string){return {id:connectionId,status:'MOCK' as const,mode:'DEVELOPMENT' as const};}
 async syncAccounts(){return [];}
 async syncTransactions(){return [];}
 async disconnect(){}
}
export function configuredLiveBankProvider():FinancialDataProvider|null{return null;}

