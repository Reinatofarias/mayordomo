import {requireUser} from '@/data/supabase';
import {requireProductAccess} from '@/data/access';
import {Onboarding} from '@/components/onboarding';
import {Brand} from '@/components/brand';
export default async function Welcome(){const {db}=await requireUser();await requireProductAccess(db);return <main className="auth-shell"><Brand href="/" /><Onboarding/></main>;}
