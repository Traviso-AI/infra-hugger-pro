import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!WEBHOOK_SECRET) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Read raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  // Only handle checkout.session.completed
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const tripSessionId = session.metadata?.trip_session_id;
  const stripeSessionId = session.id;

  if (!tripSessionId) {
    console.error("[stripe-webhook] No trip_session_id in session metadata:", stripeSessionId);
    return new Response(JSON.stringify({ received: true, error: "missing trip_session_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[stripe-webhook] Processing checkout for trip_session: ${tripSessionId}`);

  // Idempotency check — skip if already confirmed/processing/completed
  const { data: existing } = await supabase
    .from("trip_sessions")
    .select("status")
    .eq("id", tripSessionId)
    .single();

  if (existing && ["confirmed", "processing", "completed"].includes(existing.status)) {
    console.log(`[stripe-webhook] Trip session ${tripSessionId} already ${existing.status}, skipping`);

    await logEvent(tripSessionId, "webhook_duplicate", `Duplicate webhook ignored (status: ${existing.status}, stripe_session: ${stripeSessionId})`);

    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update trip_session status to 'confirmed' and store Stripe IDs
  const { error: updateError } = await supabase
    .from("trip_sessions")
    .update({
      status: "confirmed",
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: session.payment_intent as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripSessionId);

  if (updateError) {
    console.error("[stripe-webhook] Failed to update trip_session:", updateError);
    await logEvent(tripSessionId, "error", `Failed to update status: ${updateError.message}`);
    // Still return 200 to prevent Stripe retries for DB errors
    return new Response(JSON.stringify({ received: true, error: "update_failed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  await logEvent(tripSessionId, "payment_confirmed", `Payment confirmed (stripe_session: ${stripeSessionId})`);

  // Invoke orchestrate-booking in the background — do not wait
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  fetch(`${SUPABASE_URL}/functions/v1/orchestrate-booking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      trip_session_id: tripSessionId,
      idempotency_key: `booking_${stripeSessionId}`,
    }),
  }).then((res) => {
    console.log(`[stripe-webhook] orchestrate-booking invoked: ${res.status}`);
  }).catch((err) => {
    console.error("[stripe-webhook] Failed to invoke orchestrate-booking:", err);
  });

  await logEvent(tripSessionId, "orchestrator_invoked", `Booking orchestrator triggered (idempotency_key: booking_${stripeSessionId})`);

  // Return 200 immediately
  return new Response(JSON.stringify({ received: true, trip_session_id: tripSessionId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function logEvent(tripSessionId: string, eventType: string, message: string) {
  const { error } = await supabase
    .from("booking_status_events")
    .insert({
      trip_session_id: tripSessionId,
      event_type: eventType,
      message,
    });

  if (error) {
    console.error(`[stripe-webhook] Failed to log event (${eventType}):`, error);
  }
}
