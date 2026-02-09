// Mercado Pago Webhook Edge Function
// Receives payment status notifications from Mercado Pago

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Parse webhook notification
        const body = await req.json()
        console.log('Webhook received:', JSON.stringify(body))

        // Mercado Pago sends different notification types
        // We care about 'payment' type
        if (body.type !== 'payment' && body.action !== 'payment.updated' && body.action !== 'payment.created') {
            return new Response(
                JSON.stringify({ received: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get payment ID from notification
        const paymentId = body.data?.id || body.id

        if (!paymentId) {
            console.log('No payment ID in webhook')
            return new Response(
                JSON.stringify({ received: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch payment details from Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`
            }
        })

        if (!mpResponse.ok) {
            console.error('Failed to fetch payment from MP:', await mpResponse.text())
            return new Response(
                JSON.stringify({ error: 'Failed to fetch payment' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const mpPayment = await mpResponse.json()
        console.log('MP Payment:', JSON.stringify(mpPayment))

        // Get order ID from external_reference
        const orderId = mpPayment.external_reference

        if (!orderId) {
            console.log('No external_reference in payment')
            return new Response(
                JSON.stringify({ received: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Map Mercado Pago status to our status
        let paymentStatus: string
        let orderStatus: string

        switch (mpPayment.status) {
            case 'approved':
                paymentStatus = 'paid'
                orderStatus = 'paid'
                break
            case 'pending':
            case 'in_process':
                paymentStatus = 'pending'
                orderStatus = 'pending_payment'
                break
            case 'rejected':
                paymentStatus = 'failed'
                orderStatus = 'canceled'
                break
            case 'cancelled':
                paymentStatus = 'canceled'
                orderStatus = 'canceled'
                break
            case 'refunded':
                paymentStatus = 'refunded'
                orderStatus = 'refunded'
                break
            default:
                paymentStatus = 'pending'
                orderStatus = 'pending_payment'
        }

        // Update payment record
        const { error: paymentError } = await supabase
            .from('payments')
            .update({
                status: paymentStatus,
                provider_payment_id: paymentId.toString()
            })
            .eq('order_id', orderId)

        if (paymentError) {
            console.error('Error updating payment:', paymentError)
        }

        // Update order status
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: orderStatus })
            .eq('id', orderId)

        if (orderError) {
            console.error('Error updating order:', orderError)
        }

        // If payment approved, decrease stock
        if (paymentStatus === 'paid') {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, quantity')
                .eq('order_id', orderId)

            if (orderItems) {
                for (const item of orderItems) {
                    await supabase.rpc('decrease_product_stock', {
                        p_product_id: item.product_id,
                        p_quantity: item.quantity
                    })
                }
            }
        }

        console.log(`Order ${orderId} updated to status: ${orderStatus}`)

        return new Response(
            JSON.stringify({ received: true, orderId, status: orderStatus }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
