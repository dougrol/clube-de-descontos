const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.development.local', 'utf-8');
const SUPABASE_URL = envLocal.match(/VITE_SUPABASE_URL="(.*?)"/)?.[1];
let SERVICE_KEY = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)?.[1];

if (!SERVICE_KEY) {
  // Check without quotes
  const match = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) SERVICE_KEY = match[1].trim();
}

if (!SERVICE_KEY) {
  console.log("Could not find SERVICE_KEY in .env.local. Trying to parse from another line...");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('cpf', '97157929104');
  console.log("Members search result:", member, error);

  if (member && member.length > 0) {
    if (member[0].auth_user_id) {
       const { data: auth, error: authErr } = await supabase.auth.admin.getUserById(member[0].auth_user_id);
       console.log("Auth user mapped to this member:", auth?.user?.email, authErr);
    }
  } else {
    // Count total members
    const { data: countData, count, error: countErr } = await supabase.from('members').select('*', { count: 'exact', head: true });
    console.log(`There are a total of ${count} members in the database. (Error: ${countErr})`);
  }
}
run();
