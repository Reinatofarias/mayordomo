import {requireUser} from '@/data/supabase';
import {Onboarding} from '@/components/onboarding';
export default async function Welcome(){await requireUser();return <main className="auth-shell"><span className="brand">MAYORDOMO</span><Onboarding/></main>;}
