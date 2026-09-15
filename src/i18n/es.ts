export const objectives=['Salir de deudas','Gastar con más prudencia','Crear una reserva','Organizar mi familia','Ser más fiel en la administración','Entender dónde estoy perdiendo dinero','Comprar algo importante'] as const;
export const countries=[{code:'MX',name:'México',currency:'MXN',locale:'es-MX',timezone:'America/Mexico_City'},{code:'CO',name:'Colombia',currency:'COP',locale:'es-CO',timezone:'America/Bogota'},{code:'CL',name:'Chile',currency:'CLP',locale:'es-CL',timezone:'America/Santiago'},{code:'PE',name:'Perú',currency:'PEN',locale:'es-PE',timezone:'America/Lima'},{code:'AR',name:'Argentina',currency:'ARS',locale:'es-AR',timezone:'America/Argentina/Buenos_Aires'},{code:'EC',name:'Ecuador',currency:'USD',locale:'es-EC',timezone:'America/Guayaquil'},{code:'US',name:'Estados Unidos',currency:'USD',locale:'es-US',timezone:'America/New_York'}] as const;
export function displayMoney(minor:string,currency:string,locale='es-MX'){
 const formatter=new Intl.NumberFormat(locale,{style:'currency',currency,currencyDisplay:'code'});
 const digits=formatter.resolvedOptions().maximumFractionDigits!;
 const value=BigInt(minor),negative=value<0n,absolute=negative?-value:value;
 const whole=absolute/10n**BigInt(digits),fraction=(absolute%10n**BigInt(digits)).toString().padStart(digits,'0');
 const parts=formatter.formatToParts(negative?-whole:whole);
 const formatted=parts.map(p=>p.type==='fraction'?fraction:p.value).join('');
 return negative&&whole===0n?'-'+formatted:formatted;
}
