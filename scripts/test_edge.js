import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testEdgeFunction() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    // Log in to get a session
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
            email: 'douglascamolezi@gmail.com', // guess based on user path... need to mock or just send invalid token
            password: 'password'
        })
    });
    
    // Actually, maybe I can just send the request with an invalid token and see what the gateway returns!
    const token = "dummy.token.test";

    const fetchRes = await fetch(`${supabaseUrl}/functions/v1/import_ancore_member`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify([{
            name: "Test",
            email: "test@test.com",
            placa: "ABC1234",
            phone: "123456"
        }])
    });

    const text = await fetchRes.text();
    console.log("Status:", fetchRes.status);
    console.log("Response Body:", text);
}

testEdgeFunction();
