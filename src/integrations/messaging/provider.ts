export type IncomingMessage={externalId:string;from:string;receivedAt:string;type:'TEXT'|'IMAGE'|'AUDIO'|'UNSUPPORTED';text?:string;mediaId?:string};
export interface MessagingProvider{
 verify(raw:Uint8Array,signature:string|null):boolean;
 normalize(payload:unknown):IncomingMessage[];
}

