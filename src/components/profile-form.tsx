'use client';
import {useActionState,useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {updateProfile} from '@/app/(private)/perfil/actions';
import {countries,currencyOptions,localeOptions} from '@/i18n/es';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const currencies=currencyOptions();

export function ProfileForm({profile}:{profile:{name:string;phone?:string|null;country:string;currency:string;locale:string;timezone:string}}){
 const router=useRouter();
 const [state,action,pending]=useActionState(updateProfile,{});
 useEffect(()=>{if(state.message)router.refresh();},[router,state.message]);
 return <form action={action} className="form-stack narrow profile-form">
  <div><Label htmlFor="name">Nombre</Label><Input id="name" name="name" required maxLength={80} defaultValue={profile.name}/></div>
  <div><Label htmlFor="phone">Telefono</Label><Input id="phone" name="phone" maxLength={40} defaultValue={profile.phone??''} placeholder="Opcional"/></div>
  <div><Label htmlFor="country">Pais</Label><select id="country" name="country" defaultValue={profile.country}>{countries.map(country=><option key={country.code} value={country.code}>{country.name}</option>)}</select></div>
  <div><Label htmlFor="locale">Idioma y formato</Label><select id="locale" name="locale" defaultValue={profile.locale}>{!localeOptions.some(option=>option.value===profile.locale)&&<option value={profile.locale}>{profile.locale}</option>}{localeOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="hint">Ajusta formato de fechas, numeros y moneda. La traduccion completa de textos se activara en una etapa de i18n.</p></div>
  <div><Label htmlFor="currency">Moneda principal</Label><select id="currency" name="currency" defaultValue={profile.currency}>{currencies.map(currency=><option key={currency.code} value={currency.code}>{currency.label}</option>)}</select><p className="hint">Los nuevos movimientos, planes e importaciones usaran esta moneda. Los registros anteriores conservan la moneda con la que fueron creados.</p></div>
  <div><Label htmlFor="timezone">Zona horaria</Label><Input id="timezone" name="timezone" required maxLength={80} defaultValue={profile.timezone}/><p className="hint">Ejemplo: America/Mexico_City, America/Sao_Paulo o America/New_York.</p></div>
  {state.error&&<p role="alert" className="error-message">{state.error}</p>}{state.message&&<p role="status" className="success-message">{state.message}</p>}
  <Button disabled={pending}>{pending?'Guardando...':'Guardar perfil'}</Button>
 </form>;
}