import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

// Supabase client for direct DB updates when we don't have userId
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe not configured");
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log("📩 Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          // Update user subscription status in backend
          await fetch(`${BACKEND_URL}/api/user/${userId}/subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: "pro",
              status: "active",
            }),
          });
          console.log(`✅ User ${userId} upgraded to Pro`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from("users")
          .select("clerk_user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (user) {
          const status = subscription.status;
          // Check if subscription is canceled or scheduled to cancel
          const isCanceled = subscription.cancel_at_period_end || status === "canceled";
          const plan = (status === "active" && !subscription.cancel_at_period_end) ? "pro" : "free";
          const finalStatus = isCanceled ? "canceled" : status;
          
          await supabase
            .from("users")
            .update({ plan, subscription_status: finalStatus })
            .eq("clerk_user_id", user.clerk_user_id);
          
          // Also update backend cache
          await fetch(`${BACKEND_URL}/api/user/${user.clerk_user_id}/subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan, status: finalStatus }),
          });
          console.log(`📝 User ${user.clerk_user_id} subscription updated: ${finalStatus} (cancel_at_period_end: ${subscription.cancel_at_period_end})`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by stripe_customer_id
        const { data: user } = await supabase
          .from("users")
          .select("clerk_user_id")
          .eq("stripe_customer_id", customerId)
          .single();
        
        if (user) {
          await supabase
            .from("users")
            .update({
              plan: "free",
              subscription_status: "canceled",
              stripe_subscription_id: null,
            })
            .eq("clerk_user_id", user.clerk_user_id);
          
          // Also update backend cache
          await fetch(`${BACKEND_URL}/api/user/${user.clerk_user_id}/subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: "free",
              status: "canceled",
              stripe_subscription_id: null,
            }),
          });
          console.log(`❌ User ${user.clerk_user_id} subscription canceled`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await fetch(`${BACKEND_URL}/api/user/${userId}/subscription`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "past_due",
              }),
            });
            console.log(`⚠️ User ${userId} payment failed`);
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }

  return NextResponse.json({ received: true });
}


