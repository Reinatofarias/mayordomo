'use client';

import {useActionState,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {updateProfile} from '@/app/(private)/perfil/actions';
import {countries,countryFromLocale,currencyOptions,localeOptions} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const currencies=currencyOptions();

const copy={
 pt:{name:'Nome',phone:'Telefone',country:'PaÃ­s',locale:'Idioma e formato',currency:'Moeda principal',timezone:'Fuso horÃ¡rio',optional:'Opcional',localeHint:'Ajusta formato de datas, nÃºmeros e moeda. Os textos principais da plataforma aparecem em portuguÃªs quando disponÃ­veis.',currencyHint:'Novos movimentos, planos e importaÃ§Ãµes usarÃ£o esta moeda. Registros anteriores conservam a moeda em que foram criados.',timezoneHint:'Exemplo: America/Mexico_City, America/Sao_Paulo ou America/New_York.',save:'Salvar perfil',saving:'Salvando...'},
 es:{name:'Nombre',phone:'TelÃ©fono',country:'PaÃ­s',locale:'Idioma y formato',currency:'Moneda principal',timezone:'Zona horaria',optional:'Opcional',localeHint:'Ajusta formato de fechas, nÃºmeros y moneda. Los textos principales de la plataforma se mostrarÃ¡n en tu idioma cuando estÃ©n disponibles.',currencyHint:'Los nuevos movimientos, planes e importaciones usarÃ¡n esta moneda. Los registros anteriores conservan la moneda con la que fueron creados.',timezoneHint:'Ejemplo: America/Mexico_City, America/Sao_Paulo o America/New_York.',save:'Guardar perfil',saving:'Guardando...'}
};

export function ProfileForm({profile}:{profile:{name:string;phone?:string|null;country:string;currency:string;locale:string;timezone:string}}){
 const router=useRouter();
 const initial=useMemo(()=>{
  const localeCountry=countryFromLocale(profile.locale);
  const knownCountry=countries.find(item=>item.code===profile.country);
  const countryLooksDefault=profile.country==='MX'&&profile.currency==='MXN'&&localeCountry.code!=='MX';
  const shouldUseLocaleCountry=!knownCountry||countryLooksDefault;
  const selected=shouldUseLocaleCountry?localeCountry:knownCountry;
  return {country:selected.code,currency:countryLooksDefault?selected.currency:profile.currency,locale:profile.locale,timezone:countryLooksDefault?selected.timezone:profile.timezone};
 },[profile.country,profile.currency,profile.locale,profile.timezone]);
 const [country,setCountry]=useState<string>(initial.country),[currency,setCurrency]=useState<string>(initial.currency),[locale,setLocale]=useState<string>(initial.locale),[timezone,setTimezone]=useState<string>(initial.timezone);
 const text=locale.startsWith('pt')?copy.pt:copy.es;
 const [state,action,pending]=useActionState(updateProfile,{});
 useEffect(()=>{if(state.message)router.refresh();},[router,state.message]);
 function applyCountry(code:string){
  const next=countries.find(item=>item.code===code);
  if(!next){setCountry(code);return;}
  setCountry(next.code);setCurrency(next.currency);setLocale(next.locale);setTimezone(next.timezone);
 }
 function applyLocale(value:string){
  const next=countryFromLocale(value);
  setLocale(value);setCountry(next.code);setCurrency(next.currency);setTimezone(next.timezone);
 }
 return <form action={action} className="form-stack narrow profile-form">
  <div><Label htmlFor="name">{text.name}</Label><Input id="name" name="name" required maxLength={80} defaultValue={profile.name}/></div>
  <div><Label htmlFor="phone">{text.phone}</Label><Input id="phone" name="phone" maxLength={40} defaultValue={profile.phone??''} placeholder={text.optional}/></div>
  <div><Label htmlFor="country">{text.country}</Label><select id="country" name="country" value={country} onChange={event=>applyCountry(event.target.value)}>{countries.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
  <div><Label htmlFor="locale">{text.locale}</Label><select id="locale" name="locale" value={locale} onChange={event=>applyLocale(event.target.value)}>{!localeOptions.some(option=>option.value===locale)&&<option value={locale}>{locale}</option>}{localeOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="hint">{text.localeHint}</p></div>
  <div><Label htmlFor="currency">{text.currency}</Label><select id="currency" name="currency" value={currency} onChange={event=>setCurrency(event.target.value)}>{currencies.map(item=><option key={item.code} value={item.code}>{item.label}</option>)}</select><p className="hint">{text.currencyHint}</p></div>
  <div><Label htmlFor="timezone">{text.timezone}</Label><Input id="timezone" name="timezone" required maxLength={80} value={timezone} onChange={event=>setTimezone(event.target.value)}/><p className="hint">{text.timezoneHint}</p></div>
  {state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}
  <Button disabled={pending}>{pending?text.saving:text.save}</Button>
 </form>;
}