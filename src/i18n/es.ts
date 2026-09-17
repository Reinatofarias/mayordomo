export const objectives=['Salir de deudas','Gastar con mas prudencia','Crear una reserva','Organizar mi familia','Ser mas fiel en la administracion','Entender donde estoy perdiendo dinero','Comprar algo importante'] as const;

export const countries=[
 {code:'MX',name:'Mexico',currency:'MXN',locale:'es-MX',timezone:'America/Mexico_City'},
 {code:'BR',name:'Brasil',currency:'BRL',locale:'pt-BR',timezone:'America/Sao_Paulo'},
 {code:'CO',name:'Colombia',currency:'COP',locale:'es-CO',timezone:'America/Bogota'},
 {code:'CL',name:'Chile',currency:'CLP',locale:'es-CL',timezone:'America/Santiago'},
 {code:'PE',name:'Peru',currency:'PEN',locale:'es-PE',timezone:'America/Lima'},
 {code:'AR',name:'Argentina',currency:'ARS',locale:'es-AR',timezone:'America/Argentina/Buenos_Aires'},
 {code:'EC',name:'Ecuador',currency:'USD',locale:'es-EC',timezone:'America/Guayaquil'},
 {code:'US',name:'Estados Unidos',currency:'USD',locale:'en-US',timezone:'America/New_York'},
 {code:'CA',name:'Canada',currency:'CAD',locale:'en-CA',timezone:'America/Toronto'},
 {code:'GB',name:'Reino Unido',currency:'GBP',locale:'en-GB',timezone:'Europe/London'},
 {code:'ES',name:'Espana',currency:'EUR',locale:'es-ES',timezone:'Europe/Madrid'},
 {code:'PT',name:'Portugal',currency:'EUR',locale:'pt-PT',timezone:'Europe/Lisbon'},
 {code:'FR',name:'France',currency:'EUR',locale:'fr-FR',timezone:'Europe/Paris'},
 {code:'DE',name:'Deutschland',currency:'EUR',locale:'de-DE',timezone:'Europe/Berlin'},
 {code:'IT',name:'Italia',currency:'EUR',locale:'it-IT',timezone:'Europe/Rome'},
 {code:'JP',name:'Japan',currency:'JPY',locale:'ja-JP',timezone:'Asia/Tokyo'},
 {code:'KR',name:'Korea',currency:'KRW',locale:'ko-KR',timezone:'Asia/Seoul'},
 {code:'CN',name:'China',currency:'CNY',locale:'zh-CN',timezone:'Asia/Shanghai'},
 {code:'IN',name:'India',currency:'INR',locale:'en-IN',timezone:'Asia/Kolkata'},
 {code:'AU',name:'Australia',currency:'AUD',locale:'en-AU',timezone:'Australia/Sydney'}
] as const;

export const localeOptions=[
 {value:'af-ZA',label:'Afrikaans (South Africa)'},{value:'ar-SA',label:'Arabic (Saudi Arabia)'},{value:'bg-BG',label:'Bulgarian (Bulgaria)'},{value:'ca-ES',label:'Catalan (Spain)'},{value:'cs-CZ',label:'Czech (Czechia)'},{value:'da-DK',label:'Danish (Denmark)'},{value:'de-DE',label:'German (Germany)'},{value:'el-GR',label:'Greek (Greece)'},{value:'en-AU',label:'English (Australia)'},{value:'en-CA',label:'English (Canada)'},{value:'en-GB',label:'English (United Kingdom)'},{value:'en-IN',label:'English (India)'},{value:'en-US',label:'English (United States)'},{value:'es-AR',label:'Spanish (Argentina)'},{value:'es-CL',label:'Spanish (Chile)'},{value:'es-CO',label:'Spanish (Colombia)'},{value:'es-EC',label:'Spanish (Ecuador)'},{value:'es-ES',label:'Spanish (Spain)'},{value:'es-MX',label:'Spanish (Mexico)'},{value:'es-PE',label:'Spanish (Peru)'},{value:'es-US',label:'Spanish (United States)'},{value:'et-EE',label:'Estonian (Estonia)'},{value:'fi-FI',label:'Finnish (Finland)'},{value:'fr-CA',label:'French (Canada)'},{value:'fr-FR',label:'French (France)'},{value:'he-IL',label:'Hebrew (Israel)'},{value:'hi-IN',label:'Hindi (India)'},{value:'hr-HR',label:'Croatian (Croatia)'},{value:'hu-HU',label:'Hungarian (Hungary)'},{value:'id-ID',label:'Indonesian (Indonesia)'},{value:'it-IT',label:'Italian (Italy)'},{value:'ja-JP',label:'Japanese (Japan)'},{value:'ko-KR',label:'Korean (Korea)'},{value:'lt-LT',label:'Lithuanian (Lithuania)'},{value:'lv-LV',label:'Latvian (Latvia)'},{value:'ms-MY',label:'Malay (Malaysia)'},{value:'nb-NO',label:'Norwegian Bokmal (Norway)'},{value:'nl-NL',label:'Dutch (Netherlands)'},{value:'pl-PL',label:'Polish (Poland)'},{value:'pt-BR',label:'Portuguese (Brazil)'},{value:'pt-PT',label:'Portuguese (Portugal)'},{value:'ro-RO',label:'Romanian (Romania)'},{value:'ru-RU',label:'Russian (Russia)'},{value:'sk-SK',label:'Slovak (Slovakia)'},{value:'sl-SI',label:'Slovenian (Slovenia)'},{value:'sr-RS',label:'Serbian (Serbia)'},{value:'sv-SE',label:'Swedish (Sweden)'},{value:'th-TH',label:'Thai (Thailand)'},{value:'tr-TR',label:'Turkish (Turkey)'},{value:'uk-UA',label:'Ukrainian (Ukraine)'},{value:'vi-VN',label:'Vietnamese (Vietnam)'},{value:'zh-CN',label:'Chinese (Simplified, China)'},{value:'zh-HK',label:'Chinese (Hong Kong)'},{value:'zh-TW',label:'Chinese (Traditional, Taiwan)'}
] as const;

export function currencyOptions(){
 return Intl.supportedValuesOf('currency').map(code=>({code,label:currencyLabel(code)}));
}

export function currencyLabel(code:string){
 try{const name=new Intl.DisplayNames(['es'],{type:'currency'}).of(code);return name&&name!==code?`${code} - ${name}`:code;}catch{return code;}
}

export function normalizeLocale(locale:string){
 try{return Intl.getCanonicalLocales(locale)[0]??'es-MX';}catch{return 'es-MX';}
}

export function countryFromLocale(locale:string){
 const region=normalizeLocale(locale).split('-').find(part=>part.length===2&&part===part.toUpperCase());
 return countries.find(country=>country.code===region)??countries[0];
}

export function displayMoney(minor:string,currency:string,locale='es-MX'){
 const formatter=new Intl.NumberFormat(locale,{style:'currency',currency,currencyDisplay:'code'});
 const digits=formatter.resolvedOptions().maximumFractionDigits!;
 const value=BigInt(minor),negative=value<0n,absolute=negative?-value:value;
 const whole=absolute/10n**BigInt(digits),fraction=(absolute%10n**BigInt(digits)).toString().padStart(digits,'0');
 const parts=formatter.formatToParts(negative?-whole:whole);
 const formatted=parts.map(p=>p.type==='fraction'?fraction:p.value).join('');
 return negative&&whole===0n?'-'+formatted:formatted;
}