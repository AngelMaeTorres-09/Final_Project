import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// If the URL is missing, we export a "dummy" function or null to prevent the build crash
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Check your Vercel Environment Variables.");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
        },
    }
);