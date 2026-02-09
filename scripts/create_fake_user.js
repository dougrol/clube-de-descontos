import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlmlmiulkrepqclecddy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dAenupu9cD5CdYA-PYEiXg_ZJLinPh8'; // Anon Key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateCPF() {
    const rnd = (n) => Math.round(Math.random() * n);
    const mod = (dividend, divisor) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));

    const n1 = rnd(9);
    const n2 = rnd(9);
    const n3 = rnd(9);
    const n4 = rnd(9);
    const n5 = rnd(9);
    const n6 = rnd(9);
    const n7 = rnd(9);
    const n8 = rnd(9);
    const n9 = rnd(9);

    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11));
    if (d1 >= 10) d1 = 0;

    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11));
    if (d2 >= 10) d2 = 0;

    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}

async function createFakeUser() {
    const cpf = generateCPF();
    const cleanCPF = cpf.replace(/\D/g, '');
    const email = `test.${cleanCPF}@tavarescar.com`;
    const password = cleanCPF; // Senha igual ao CPF conforme pedido

    console.log(`Gerando usuário...`);
    console.log(`CPF: ${cpf}`);
    console.log(`Email: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: 'Associado Teste Automático',
                cpf: cleanCPF,
                role: 'USER',
                plan: 'Gold' // Já dando plano Gold pra testar
            }
        }
    });

    if (error) {
        console.error('Erro ao criar usuário:', error.message);
        return;
    }

    // Upsert manual para garantir dados
    if (data.user) {
        const { error: upsertError } = await supabase.from('users').upsert({
            id: data.user.id,
            email: email,
            name: 'Associado Teste Automático',
            cpf: cleanCPF,
            role: 'USER',
            plan: 'Gold'
        }, { onConflict: 'id' });

        if (upsertError) {
            console.error('Erro no upsert da tabela users:', upsertError.message);
        } else {
            console.log('Tabela users atualizada com sucesso.');
        }
    }

    console.log('\n--- SUCESSO ---');
    console.log(`Usuário criado!`);
    console.log(`LOGIN (CPF): ${cpf}`);
    console.log(`SENHA: ${cleanCPF}`);
}

createFakeUser();
