import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if variables are missing to prevent the app from crashing silently
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase Environment Variables. Check your .env.local file.")
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)