
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmlmiulkrepqclecddy.supabase.co';
const supabaseAnonKey = 'sb_publishable_dAenupu9cD5CdYA-PYEiXg_ZJLinPh8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log('--- ALL PARTNERS ---');
        // Check partners
        const { data: partners, error: partnersError } = await supabase
            .from('partners')
            .select('*');

        console.log('--- ALL PARTNERS ---');
        partners?.forEach(p => {
            console.log(`- ${p.name} (ID: ${p.id}) [Benefit: ${p.benefit}]`);
        });

        // Check recent coupons
        const { data: coupons, error: couponsError } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        console.log('\n--- RECENT COUPONS ---');
        if (couponsError) {
            console.error('Error fetching coupons:', couponsError.message);
        } else {
            coupons?.forEach(c => {
                console.log(`- ${c.code} [Status: ${c.status}] [Partner: ${c.partner_name}] [User: ${c.user_name}] [Expires: ${c.expires_at}]`);
            });
        }
}

checkData();
