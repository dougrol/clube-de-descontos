import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string
);

async function checkUser() {
  const email = '97157929104@login.tavarescar.com.br';
  console.log(`Checking email: ${email}`);

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error('List error:', listError.message);
  } else {
      const allUsers = users?.users || [];
      const found = allUsers.find(u => u.email === email);
      console.log(`Found in auth.users via listUsers?`, !!found);
  }

  console.log(`Trying to create user...`);
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'password123',
    email_confirm: true,
  });

  if (createError) {
    console.error('Create error EXACT output:', createError);
  } else {
    console.log('Created successfully!', createData?.user?.id);
  }
}
checkUser();
