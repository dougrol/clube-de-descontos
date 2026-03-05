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
      const { name, cpf, phone, association_name, status, valid_until, password, placa, birth_date } = member
      
      // Validação Básica
      if (!name || !cpf || !association_name) {
        results.push({ cpf, status: 'error', message: 'Missing required fields (name, cpf, association_name)' })
        continue
      }

      const cpfDigits = cpf.replace(/\D/g, '')
      // Aceitar CPF (11 dígitos) ou CNPJ (14 dígitos)
      if (cpfDigits.length !== 11 && cpfDigits.length !== 14) {
          results.push({ cpf, status: 'error', message: `CPF/CNPJ inválido (${cpfDigits.length} dígitos, esperado 11 ou 14)` })
          continue
      }
      
      const deterministicEmail = `${cpfDigits}@login.tavarescar.com.br`
      const passwordToUse = password || cpfDigits // Fallback password = cpf/cnpj se não passado

      try {
        // Passo A: Upsert Associação (se não existir cria, se existir retorna)
        // Gerar slug a partir do nome (ex: "Eleva Mais" -> "eleva-mais")
        const associationSlug = association_name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        const { data: associationData, error: assocError } = await supabaseClient
            .from('associations')
            .upsert({ name: association_name, slug: associationSlug }, { onConflict: 'name', ignoreDuplicates: false })
            .select('*')
            .single()
            
        if (assocError) throw new Error(`Association Error: ${assocError.message}`)
        
        const associationId = associationData.id

        // Passo B: Lidar com o Auth User
        let authUserId = null;
        
        // 1. Verificar se o membro já existe na tabela members para pegar o ID rapidamente
        const { data: existingMember } = await supabaseClient
            .from('members')
            .select('auth_user_id')
            .eq('cpf', cpfDigits)
            .single()

        if (existingMember?.auth_user_id) {
            authUserId = existingMember.auth_user_id;

            // Opcionalmente atualiza a senha de volta e força o email correto
            await supabaseClient.auth.admin.updateUserById(authUserId, { 
                email: deterministicEmail,
                password: passwordToUse 
            });
            // Não verificamos erros de update de forma bloqueante aqui 
            // pois se o usuário existe, o importante é liberar o acesso na tabela groups
        } else {
            // Se não estava no members, vamos procurar no Auth
            const { data: userList, error: listUserError } = await supabaseClient.auth.admin.listUsers({
              perPage: 1000
            })
            if (listUserError) throw new Error(`List Users Error: ${listUserError.message}`)
                
            const existingAuthUser = userList.users.find(u => u.email === deterministicEmail || u.email === `${cpfDigits}@login.tavarescar`)
            
            if (existingAuthUser) {
               authUserId = existingAuthUser.id
               // Se o password ou email mudaram
               await supabaseClient.auth.admin.updateUserById(authUserId, { 
                   email: deterministicEmail,
                   password: passwordToUse 
               })
            } else {
               // Tentar criar
               const { data: authData, error: createAuthError } = await supabaseClient.auth.admin.createUser({
                  email: deterministicEmail,
                  password: passwordToUse,
                  email_confirm: true,
                  user_metadata: { name: name, cpf: cpfDigits }
               })
               
               if (createAuthError) {
                 if (createAuthError.message.includes('already registered')) {
                    const { data: retryUsers } = await supabaseClient.auth.admin.listUsers({ perPage: 1000 })
                    const retryUser = retryUsers?.users.find(u => u.email === deterministicEmail)
                    if (retryUser) {
                      authUserId = retryUser.id
                    } else {
                      throw new Error(`Conflict creating user but couldn't find them in list`)
                    }
                 } else {
                    throw new Error(`Create Auth Error: ${createAuthError.message}`)
                 }
               } else {
                 authUserId = authData.user.id
               }
            }
        }
        
        // Passo C: Upsert na tabela members pública (com placa e birth_date opcionais)
        const memberData: any = {
           name: name,
           cpf: cpfDigits,
           phone: phone || null,
           association_id: associationId,
           status: status || 'active',
           valid_until: valid_until || null,
           auth_user_id: authUserId
        }
        
        // Adicionar campos opcionais apenas se existirem
        if (placa) memberData.placa = placa
        if (birth_date) memberData.birth_date = birth_date

        const { error: memberUpsertError } = await supabaseClient
            .from('members')
            .upsert(memberData, { onConflict: 'cpf' })
            
        if (memberUpsertError) throw new Error(`Member Upsert Error: ${memberUpsertError.message}`)

        results.push({ cpf: cpfDigits, status: 'success', member_name: name })
      } catch (err: any) {
        results.push({ cpf: cpfDigits, status: 'error', message: err.message })
      }
    }

    // Retorna Sumário
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
