
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmlmiulkrepqclecddy.supabase.co';
const supabaseAnonKey = 'sb_publishable_dAenupu9cD5CdYA-PYEiXg_ZJLinPh8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- ALL PARTNERS ---');
    const { data: partners, error: pError } = await supabase.from('partners').select('id, name, benefit');
    if (pError) {
        console.error('Error fetching partners:', pError);
    } else {
        partners.forEach(p => console.log(`- ${p.name} (ID: ${p.id}) [Benefit: ${p.benefit}]`));
    }
}

checkData();
