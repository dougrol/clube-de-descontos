import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Auth Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
         return new Response(JSON.stringify({ error: 'Unauthorized to perform this action' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const membersToImport = Array.isArray(body) ? body : [body]
    
    const results = []

    for (const member of membersToImport) {
      const { name, email, phone, placa, status, association_name } = member
      
      if (!name || !email || !placa) {
        results.push({ email, name, status: 'error', message: 'Faltando campos obrigatórios (nome, email, placa)' })
        continue
      }

      // Ensure association exists or create it
      const actualAssocName = association_name || 'Ancore'
      
      try {
        const { data: associationData, error: assocError } = await supabaseClient
            .from('associations')
            .upsert({ name: actualAssocName }, { onConflict: 'name', ignoreDuplicates: false })
            .select('*')
            .single()
            
        if (assocError) throw new Error(`Association Error: ${assocError.message}`)
        
        const associationId = associationData.id

        let authUserId = null;
        const normalizedEmail = email.toLowerCase().trim()
        const cleanPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        
        const { data: existingUsers, error: listUserError } = await supabaseClient.auth.admin.listUsers()
        if (listUserError) throw new Error(`List Users Error: ${listUserError.message}`)
            
        const existingAuthUser = existingUsers.users.find((u: any) => u.email === normalizedEmail)
        
        if (existingAuthUser) {
           authUserId = existingAuthUser.id
           await supabaseClient.auth.admin.updateUserById(authUserId, { password: cleanPlaca })
        } else {
           const { data: authData, error: createAuthError } = await supabaseClient.auth.admin.createUser({
              email: normalizedEmail,
              password: cleanPlaca,
              email_confirm: true,
              user_metadata: { name: name, placa: cleanPlaca }
           })
           if (createAuthError) throw new Error(`Create Auth Error: ${createAuthError.message}`)
           authUserId = authData.user.id
        }
        
        // Upsert into members table
        // Using email as a conflict resolution since CPF is omitted
        // In the auth_user_id we have the foreign key
        const { error: memberUpsertError } = await supabaseClient
            .from('members')
            .upsert({
               name: name,
               email: normalizedEmail,
               placa: cleanPlaca,
               phone: phone || null,
               association_id: associationId,
               status: status || 'active',
               auth_user_id: authUserId
            }, { onConflict: 'auth_user_id' }) 
            
        if (memberUpsertError) throw new Error(`Member Upsert Error: ${memberUpsertError.message}`)

        results.push({ email: normalizedEmail, status: 'success', member_name: name })
      } catch (err: any) {
        results.push({ email, status: 'error', message: err.message })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ global_error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
