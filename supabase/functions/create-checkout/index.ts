import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { partnerId, plan } = await req.json()

    // Inicializa Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Mapeamento de Planos para Preços (IDs do Stripe)
    // O usuário precisa trocar esses valores pelos reais do dashboard
    const priceMap = {
      essencial: Deno.env.get('STRIPE_PRICE_ESSENCIAL') || 'price_placeholder_essencial',
      destaque: Deno.env.get('STRIPE_PRICE_DESTAQUE') || 'price_placeholder_destaque'
    }

    const priceId = priceMap[plan as keyof typeof priceMap]

    if (!priceId) {
      throw new Error(`Plano inválido: ${plan}`)
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/admin?success=true`,
      cancel_url: `${req.headers.get('origin')}/admin?canceled=true`,
      client_reference_id: partnerId,
      metadata: {
        partnerId: partnerId,
        plan: plan
      }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
