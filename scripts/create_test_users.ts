
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load env vars
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    { email: 'associado@teste.com', password: 'password123', role: 'USER' },
    { email: 'parceiro@teste.com', password: 'password123', role: 'PARTNER' },
    { email: 'admin@teste.com', password: 'password123', role: 'ADMIN' },
];

async function createUsers() {
    console.log('--- Starting User Creation ---');

    for (const user of users) {
        console.log(`Creating ${user.role} (${user.email})...`);

        // 1. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (error) {
            console.error(`Error creating ${user.email}:`, error.message);
            // If user exists, try to sign in to get the ID
            if (error.message.includes('already registered')) {
                console.log(`User exists. Signing in to get ID...`);
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: user.password
                });

                if (signInData.user) {
                    console.log(`✅ Retrieved ID: ${signInData.user.id}`);
                    console.log(`\n--- SQL TO RUN IN SUPABASE DASHBOARD ---`);
                    console.log(`UPDATE public.users SET role = '${user.role}' WHERE id = '${signInData.user.id}';`);
                    if (user.role === 'PARTNER') {
                        console.log(`INSERT INTO public.partners (id, name, category, description, benefit, full_rules, logo_url, cover_url, city, status) 
                       VALUES ('${signInData.user.id}', 'Parceiro Teste', 'Automotivo', 'Descrição teste', '10% OFF', 'Regras teste', '', '', 'São Paulo', 'active')
                       ON CONFLICT (id) DO NOTHING;`);
                    }
                    console.log(`----------------------------------------\n`);
                    continue;
                } else {
                    console.error(`Failed to sign in as ${user.email}:`, signInError?.message);
                    continue;
                }
            }
            continue;
        }

        if (data.user) {
            console.log(`✅ User created: ${data.user.id}`);
            console.log(`\n--- SQL TO RUN IN SUPABASE DASHBOARD ---`);
            console.log(`UPDATE public.users SET role = '${user.role}' WHERE id = '${data.user.id}';`);
            if (user.role === 'PARTNER') {
                console.log(`INSERT INTO public.partners (id, name, category, description, benefit, full_rules, logo_url, cover_url, city, status) 
          VALUES ('${data.user.id}', 'Parceiro Teste', 'Automotivo', 'Descrição teste', '10% OFF', 'Regras teste', '', '', 'São Paulo', 'active')
          ON CONFLICT (id) DO NOTHING;`);
            }
            console.log(`----------------------------------------\n`);
        }
    }
}

createUsers();
