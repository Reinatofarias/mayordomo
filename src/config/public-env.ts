export const PUBLIC_SUPABASE_URL =
 process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvmqzzmdbshjlatzrvfw.supabase.co';

export const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_0XUluJZBhls7oeLZMG2IDQ_jxTaDxRl';

export function hasPublicSupabaseConfig() {
 return Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
