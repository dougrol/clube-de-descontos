const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing environment variables. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const cpfToFind = '97157929104';
  console.log(`Buscando membro com CPF: ${cpfToFind}...`);
  
  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('cpf', cpfToFind)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('Membro não encontrado na tabela `members`.');
    } else {
      console.error('Erro ao buscar membro:', error);
    }
  } else {
    console.log('Membro encontrado:', member);
    
    if (member.auth_user_id) {
        console.log(`Buscando usuário Auth com ID: ${member.auth_user_id}...`);
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(member.auth_user_id);
        if (authError) {
            console.error('Erro ao buscar usuário Auth:', authError);
        } else {
            console.log('Usuário Auth encontrado:', authUser.user);
        }
    } else {
        console.log('Membro não tem `auth_user_id`.');
    }
  }
}

run();
