import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check for missing environment variables
const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (isMissingCredentials) {
    console.error(
        '⚠️ Supabase credentials not found!\n' +
        'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.\n' +
        'On Netlify: Site configuration → Environment variables'
    );
}

// Create client with fallback empty strings to prevent crash
// The client will fail on API calls but won't crash the app initialization
export const supabase: SupabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = !isMissingCredentials;
