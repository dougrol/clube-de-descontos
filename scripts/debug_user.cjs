const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file directly since this is a quick script
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY 
);

async function checkUser() {
  const email = '97157929104@login.tavarescar.com.br';
  console.log(`Checking email: ${email}`);

  // 1. Check auth.users (requires service role, can't query auth.users directly via JS client, but we can use listUsers)
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error('List error (might be using anon key without admin privileges):', listError.message);
  } else {
      const allUsers = users?.users || [];
      const found = allUsers.find(u => u.email === email);
      console.log(`Found in auth.users via listUsers?`, !!found);
  }

  // 3. Try to create the user to see the EXACT error
  console.log(`Trying to create user...`);
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'password123',
    email_confirm: true,
  });

  if (createError) {
    console.error('Create error EXACT output:', createError);
  } else {
    console.log('Created successfully!', createData.user.id);
  }
  
  // 4. Check public.users
  console.log(`Checking public.users...`);
  const { data: publicUser, error: publicError } = await supabase.from('users').select('*').eq('email', email);
  if (publicError) console.error('Public users error:', publicError);
  console.log('Public user data:', publicUser);

  // 5. Check public.members
  console.log(`Checking public.members...`);
  const { data: memberUser, error: memberError } = await supabase.from('members').select('*').eq('cpf', '97157929104');
  console.log('Public member data:', memberUser);
}

checkUser();
