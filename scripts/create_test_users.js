import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlmlmiulkrepqclecddy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dAenupu9cD5CdYA-PYEiXg_ZJLinPh8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// IDs existentes no banco
const ASSOCIATION_ID = '73e7be37-6027-41d2-90b3-3da2f7edd268'; // Eleva Mais
const PARTNER_ID = '1565d1e2-a04f-4956-aa4c-d216a726d91a'; // Tavares

function generateValidCPF() {
    const rnd = (n) => Math.round(Math.random() * n);
    const mod = (dividend, divisor) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));

    const n1 = rnd(9), n2 = rnd(9), n3 = rnd(9);
    const n4 = rnd(9), n5 = rnd(9), n6 = rnd(9);
    const n7 = rnd(9), n8 = rnd(9), n9 = rnd(9);

    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11));
    if (d1 >= 10) d1 = 0;

    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11));
    if (d2 >= 10) d2 = 0;

    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

async function createUser({ email, password, name, cpf, role, associationId, partnerId }) {
    console.log(`\n📝 Criando ${role}: ${email}`);

    // 1. Criar no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, cpf, role }
        }
    });

    if (error) {
        console.error(`❌ Erro auth: ${error.message}`);
        return null;
    }

    if (!data.user) {
        console.error('❌ Usuário não foi criado');
        return null;
    }

    // 2. Inserir na tabela public.users
    const userData = {
        id: data.user.id,
        email,
        name,
        cpf,
        role,
        plan: role === 'USER' ? 'Gold' : null,
        association_id: associationId || null,
        partner_id: partnerId || null
    };

    const { error: upsertError } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'id' });

    if (upsertError) {
        console.error(`❌ Erro upsert: ${upsertError.message}`);
        return null;
    }

    console.log(`✅ ${role} criado com sucesso!`);
    return userData;
}

async function main() {
    console.log('🚀 Criando usuários de teste...\n');
    console.log('='.repeat(50));

    const results = [];

    // 1. ASSOCIADO
    const cpfAssociado = generateValidCPF();
    const associado = await createUser({
        email: `associado.teste@tavarescar.com`,
        password: cpfAssociado,
        name: 'João Associado Teste',
        cpf: cpfAssociado,
        role: 'USER',
        associationId: ASSOCIATION_ID
    });
    if (associado) {
        results.push({
            tipo: 'ASSOCIADO',
            email: associado.email,
            cpf: cpfAssociado,
            senha: cpfAssociado
        });
    }

    // 2. PARCEIRO
    const parceiro = await createUser({
        email: `parceiro.teste@tavarescar.com`,
        password: 'parceiro123',
        name: 'Maria Parceira Teste',
        cpf: null,
        role: 'PARTNER',
        partnerId: PARTNER_ID
    });
    if (parceiro) {
        results.push({
            tipo: 'PARCEIRO',
            email: parceiro.email,
            senha: 'parceiro123'
        });
    }

    // Resumo Final
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESUMO DOS USUÁRIOS CRIADOS:');
    console.log('='.repeat(50));

    results.forEach((u, i) => {
        console.log(`\n${i + 1}. ${u.tipo}`);
        console.log(`   📧 Email: ${u.email}`);
        if (u.cpf) console.log(`   🆔 CPF: ${u.cpf}`);
        console.log(`   🔑 Senha: ${u.senha}`);
    });

    console.log('\n✅ Processo concluído!');
}

main().catch(console.error);
