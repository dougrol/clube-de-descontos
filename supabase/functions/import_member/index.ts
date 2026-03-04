import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lida com chamadas de preflight/OPTIONS do navegador (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Client do Supabase com Service Role para bypass do RLS (Criar Usuario + Associações)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Validação Básica Auth - Checa se quem chamou a função é válido
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Auth Header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Identificaremos quem está chamando a função para garantir segurança, 
    // embora você possa depois adicionar roles (ex: checar se email == admin@...).
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
         return new Response(JSON.stringify({ error: 'Unauthorized to perform this action' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // (Opcional: if user.email !== 'admin@seuapp.com' return error 403)

    // 4. Receber Body (Pode ser array de membros ou um objeto unico, aqui faremos genérico)
    const body = await req.json()
    const membersToImport = Array.isArray(body) ? body : [body]
    
    const results = []

    // 5. Loop por cada membro
    for (const member of membersToImport) {
      const { name, cpf, phone, association_name, status, valid_until, password } = member
      
      // Validação Básica
      if (!name || !cpf || !association_name) {
        results.push({ cpf, status: 'error', message: 'Missing required fields (name, cpf, association_name)' })
        continue
      }

      const cpfDigits = cpf.replace(/\D/g, '')
      if (cpfDigits.length !== 11) {
          results.push({ cpf, status: 'error', message: 'Invalid CPF length' })
          continue
      }
      
      const deterministicEmail = `${cpfDigits}@login.tavarescar`
      const passwordToUse = password || cpfDigits // Fallback password = cpf se não passado

      try {
        // Passo A: Upsert Associação (se não existir cria, se existir retorna)
        const { data: associationData, error: assocError } = await supabaseClient
            .from('associations')
            .upsert({ name: association_name }, { onConflict: 'name', ignoreDuplicates: false })
            .select('*')
            .single()
            
        if (assocError) throw new Error(`Association Error: ${assocError.message}`)
        
        const associationId = associationData.id

        // Passo B: Lidar com o Auth User
        let authUserId = null;
        
        // 1. Tentar achar esse usuário via CPF Fake Email
        const { data: existingUsers, error: listUserError } = await supabaseClient.auth.admin.listUsers()
        if (listUserError) throw new Error(`List Users Error: ${listUserError.message}`)
            
        const existingAuthUser = existingUsers.users.find(u => u.email === deterministicEmail)
        
        if (existingAuthUser) {
           // Já existe, pega o ID e podemos ignorar re-criação. Opcional: atualizar a senha
           authUserId = existingAuthUser.id
           if(passwordToUse !== cpfDigits) {
              await supabaseClient.auth.admin.updateUserById(authUserId, { password: passwordToUse })
           }
        } else {
           // Novo usuário, cria via Admin
           const { data: authData, error: createAuthError } = await supabaseClient.auth.admin.createUser({
              email: deterministicEmail,
              password: passwordToUse,
              email_confirm: true, // Já cria confirmado
              user_metadata: { name: name, cpf: cpfDigits }
           })
           if (createAuthError) throw new Error(`Create Auth Error: ${createAuthError.message}`)
           authUserId = authData.user.id
        }
        
        // Passo C: Upsert na tabela members pública usando id do Auth e Associação
        const { error: memberUpsertError } = await supabaseClient
            .from('members')
            .upsert({
               name: name,
               cpf: cpfDigits,
               phone: phone || null,
               association_id: associationId,
               status: status || 'active',
               valid_until: valid_until || null,
               auth_user_id: authUserId
            }, { onConflict: 'cpf' })
            
        if (memberUpsertError) throw new Error(`Member Upsert Error: ${memberUpsertError.message}`)

        results.push({ cpf: cpfDigits, status: 'success', member_name: name })
      } catch (err) {
        results.push({ cpf: cpfDigits, status: 'error', message: err.message })
      }
    }

    // Retorna Sumário
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ global_error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
