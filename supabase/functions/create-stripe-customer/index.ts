import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.1.0?target=deno"; // Updated Stripe version to 16.1.0
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'; // Supabase client for Edge Functions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe secret key not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20', // Use a recent API version
      httpClient: Stripe.createFetchHttpClient(), // Use Deno's fetch for compatibility
    });

    let customerId;

    // --- START: Manual check for existing Stripe customer by email ---
    // This bypasses the Stripe SDK's `customers.list` method which was causing issues with Deno's fetch.
    const listCustomersUrl = `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`;
    const listResponse = await fetch(listCustomersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        // 'Content-Type': 'application/x-www-form-urlencoded', // Not strictly necessary for GET with query params
      },
    });

    if (!listResponse.ok) {
      const errorData = await listResponse.json();
      console.error("Manual Stripe customer list error:", errorData);
      throw new Error(`Failed to list existing Stripe customer: ${errorData.message || listResponse.statusText}`);
    }
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      customerId = listData.data[0].id;
      console.log(`Existing Stripe customer found (manual list) for ${email}: ${customerId}`);
    } else {
      // --- END: Manual check ---

      // If no existing customer, create a new one using the Stripe SDK
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          supabase_user_id: userId, // Link the Stripe customer to the Supabase user ID
        },
      });
      customerId = customer.id;
      console.log(`New Stripe customer created for ${email}: ${customerId}`);
    }

    // Update the user's profile in Supabase with the Stripe customer ID
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating Supabase profile with Stripe customer ID:", updateError);
      return new Response(JSON.stringify({ error: 'Failed to update user profile in Supabase', details: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ customerId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in create-stripe-customer Edge Function:", error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});