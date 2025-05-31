import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno"; // Using a recent Stripe version for Deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'; // Supabase client for Edge Functions

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20", // Use a recent API version for consistency
  httpClient: Stripe.createFetchHttpClient(), // Use Deno's fetch for compatibility
});

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  const body = await req.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret!);
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Initialize Supabase client with service role key for database updates
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string; // customer can be string or object

        console.log(`Checkout session completed for customer: ${customerId}`);

        // Retrieve the customer to get the supabase_user_id from metadata
        const customer = await stripe.customers.retrieve(customerId);
        const supabaseUserId = (customer as Stripe.Customer).metadata?.supabase_user_id;

        if (supabaseUserId) {
          // Update the user's profile to set is_subscribed to true
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_subscribed: true, stripe_customer_id: customerId }) // Ensure stripe_customer_id is also set/updated
            .eq('id', supabaseUserId);

          if (error) {
            console.error("Error updating profile on checkout.session.completed:", error);
          } else {
            console.log(`User ${supabaseUserId} marked as subscribed.`);
          }
        } else {
          console.warn(`No supabase_user_id found in metadata for customer ${customerId}. Cannot update profile.`);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Retrieve the customer to get the supabase_user_id from metadata
        const customer = await stripe.customers.retrieve(customerId);
        const supabaseUserId = (customer as Stripe.Customer).metadata?.supabase_user_id;

        if (supabaseUserId) {
          const isSubscribed = subscription.status === 'active' || subscription.status === 'trialing';
          console.log(`Subscription updated for customer: ${customerId}, status: ${subscription.status}. is_subscribed: ${isSubscribed}`);

          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_subscribed: isSubscribed })
            .eq('id', supabaseUserId);

          if (error) {
            console.error("Error updating profile on customer.subscription.updated:", error);
          } else {
            console.log(`User ${supabaseUserId} subscription status updated to ${isSubscribed}.`);
          }
        } else {
          console.warn(`No supabase_user_id found in metadata for customer ${customerId}. Cannot update profile.`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Retrieve the customer to get the supabase_user_id from metadata
        const customer = await stripe.customers.retrieve(customerId);
        const supabaseUserId = (customer as Stripe.Customer).metadata?.supabase_user_id;

        if (supabaseUserId) {
          console.log(`Subscription deleted for customer: ${customerId}. Marking user as unsubscribed.`);
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_subscribed: false })
            .eq('id', supabaseUserId);

          if (error) {
            console.error("Error updating profile on customer.subscription.deleted:", error);
          } else {
            console.log(`User ${supabaseUserId} marked as unsubscribed.`);
          }
        } else {
          console.warn(`No supabase_user_id found in metadata for customer ${customerId}. Cannot update profile.`);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing Stripe webhook event:", error);
    return new Response(JSON.stringify({ error: 'Webhook processing error', details: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});