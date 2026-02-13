// Mercado Pago Payment Creation Edge Function
// Deploy to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
    product_id: string
    quantity: number
    method: 'pix' | 'card'
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get auth header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with user's JWT
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!

        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Get authenticated user
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ success: false, error: 'User not authenticated' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request body
        const { product_id, quantity, method }: PaymentRequest = await req.json()

        if (!product_id || !quantity || !method) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch product
        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', product_id)
            .eq('active', true)
            .single()

        if (productError || !product) {
            return new Response(
                JSON.stringify({ success: false, error: 'Product not found or inactive' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check stock
        if (product.stock < quantity) {
            return new Response(
                JSON.stringify({ success: false, error: 'Insufficient stock' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const totalAmount = product.price_discount * quantity

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                partner_id: product.partner_id,
                status: 'pending_payment',
                total_amount: totalAmount
            })
            .select()
            .single()

        if (orderError) {
            console.error('Error creating order:', orderError)
            return new Response(
                JSON.stringify({ success: false, error: 'Failed to create order' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create order item
        await supabaseAdmin
            .from('order_items')
            .insert({
                order_id: order.id,
                product_id: product_id,
                quantity: quantity,
                unit_price: product.price_discount
            })

        // Create Mercado Pago payment
        const mpPaymentData = {
            transaction_amount: totalAmount,
            description: product.title,
            external_reference: order.id,
            notification_url: `${supabaseUrl}/functions/v1/mp_webhook`,
            ...(method === 'pix' ? {
                payment_method_id: 'pix',
                payer: {
                    email: user.email
                }
            } : {
                // For card payments, create a preference for checkout
            })
        }

        let mpResponse: Response

        if (method === 'pix') {
            // Create PIX payment directly
            mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': order.id
                },
                body: JSON.stringify(mpPaymentData)
            })
        } else {
            // Create checkout preference for card
            const preferenceData = {
                items: [{
                    title: product.title,
                    quantity: quantity,
                    unit_price: product.price_discount,
                    currency_id: 'BRL'
                }],
                external_reference: order.id,
                notification_url: `${supabaseUrl}/functions/v1/mp_webhook`,
                back_urls: {
                    success: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/#/meus-pedidos`,
                    failure: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/#/loja`,
                    pending: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/#/meus-pedidos`
                },
                auto_return: 'approved'
            }

            mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${mpAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferenceData)
            })
        }

        const mpResult = await mpResponse.json()

        if (!mpResponse.ok) {
            console.error('Mercado Pago error:', mpResult)
            // Rollback: update order status to canceled
            await supabaseAdmin
                .from('orders')
                .update({ status: 'canceled' })
                .eq('id', order.id)

            return new Response(
                JSON.stringify({ success: false, error: 'Payment gateway error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create payment record
        const paymentRecord = {
            order_id: order.id,
            provider: 'mercadopago',
            provider_payment_id: mpResult.id?.toString() || mpResult.collector_id?.toString(),
            status: 'pending',
            method: method,
            ...(method === 'pix' ? {
                pix_qr_code: mpResult.point_of_interaction?.transaction_data?.qr_code,
                pix_qr_code_base64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64
            } : {
                checkout_url: mpResult.init_point
            })
        }

        await supabaseAdmin
            .from('payments')
            .insert(paymentRecord)

        // Return success response
        const response = {
            success: true,
            orderId: order.id,
            ...(method === 'pix' ? {
                pixQrCode: mpResult.point_of_interaction?.transaction_data?.qr_code,
                pixQrCodeBase64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64
            } : {
                checkoutUrl: mpResult.init_point
            })
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({ success: false, error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
