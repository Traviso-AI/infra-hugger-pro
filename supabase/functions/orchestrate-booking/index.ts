import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function logEvent(tripSessionId: string, eventType: string, message: string) {
  await supabase.from("booking_status_events").insert({
    trip_session_id: tripSessionId,
    event_type: eventType,
    message,
  });
  console.log(`[orchestrate] [${tripSessionId}] ${eventType}: ${message}`);
}

async function failAndRefund(
  tripSessionId: string,
  paymentIntentId: string | null,
  reason: string,
) {
  // Issue Stripe refund
  if (paymentIntentId) {
    try {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
      console.log(`[orchestrate] Refund issued for payment_intent: ${paymentIntentId}`);
    } catch (e) {
      console.error("[orchestrate] Refund failed:", e);
    }
  }

  await supabase
    .from("trip_sessions")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", tripSessionId);

  await logEvent(tripSessionId, "failed", reason);
}

async function generateHotelbedsSig(): Promise<string> {
  const apiKey = Deno.env.get("HOTELBEDS_API_KEY")!;
  const secret = Deno.env.get("HOTELBEDS_SECRET")!;
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = apiKey + secret + timestamp;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Duffel: create order (book flight)
// ---------------------------------------------------------------------------
async function bookFlight(
  bookingToken: string,
  passengers: any[],
): Promise<{ success: boolean; reference?: string; error?: string }> {
  const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
  if (!DUFFEL_API_KEY) return { success: false, error: "DUFFEL_API_KEY not configured" };

  const res = await fetch("https://api.duffel.com/air/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "instant",
        selected_offers: [bookingToken],
        passengers,
        payments: [
          {
            type: "balance",
            currency: "USD",
            amount: "0",
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[orchestrate] Duffel booking error:", res.status, errBody);
    return { success: false, error: `Duffel ${res.status}: ${errBody.slice(0, 200)}` };
  }

  const data = await res.json();
  const order = data.data;
  return {
    success: true,
    reference: order?.booking_reference ?? order?.id ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Duffel: cancel order
// ---------------------------------------------------------------------------
async function cancelFlight(
  orderId: string,
): Promise<void> {
  const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
  if (!DUFFEL_API_KEY) return;

  try {
    await fetch(`https://api.duffel.com/air/order_cancellations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_API_KEY}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: { order_id: orderId },
      }),
    });
    console.log(`[orchestrate] Duffel order ${orderId} cancellation requested`);
  } catch (e) {
    console.error("[orchestrate] Duffel cancellation failed:", e);
  }
}

// ---------------------------------------------------------------------------
// Hotelbeds: confirm booking
// ---------------------------------------------------------------------------
async function bookHotel(
  rateKey: string,
  holder: { name: string; surname: string },
): Promise<{ success: boolean; reference?: string; error?: string }> {
  const HOTELBEDS_API_KEY = Deno.env.get("HOTELBEDS_API_KEY");
  if (!HOTELBEDS_API_KEY) return { success: false, error: "HOTELBEDS_API_KEY not configured" };

  const signature = await generateHotelbedsSig();

  const res = await fetch("https://api.test.hotelbeds.com/hotel-api/1.0/bookings", {
    method: "POST",
    headers: {
      "Api-key": HOTELBEDS_API_KEY,
      "X-Signature": signature,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      holder,
      rooms: [
        {
          rateKey,
          paxes: [
            { roomId: 1, type: "AD", name: holder.name, surname: holder.surname },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("[orchestrate] Hotelbeds booking error:", res.status, errBody);
    return { success: false, error: `Hotelbeds ${res.status}: ${errBody.slice(0, 200)}` };
  }

  const data = await res.json();
  const booking = data.booking;
  return {
    success: true,
    reference: booking?.reference ?? booking?.clientReference ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { trip_session_id, idempotency_key } = await req.json();

    if (!trip_session_id) {
      return new Response(JSON.stringify({ error: "missing trip_session_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[orchestrate] Starting for trip_session: ${trip_session_id} (key: ${idempotency_key})`);

    // --- Step 1: Load trip session ---
    const { data: session, error: sessionError } = await supabase
      .from("trip_sessions")
      .select("*")
      .eq("id", trip_session_id)
      .single();

    if (sessionError || !session) {
      console.error("[orchestrate] Trip session not found:", sessionError);
      return new Response(JSON.stringify({ error: "trip_session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Idempotency: skip if already processing or completed
    if (["processing", "completed"].includes(session.status)) {
      console.log(`[orchestrate] Already ${session.status}, skipping`);
      return new Response(JSON.stringify({ status: session.status, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set status to processing
    await supabase
      .from("trip_sessions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", trip_session_id);

    // --- Step 2: Log start ---
    await logEvent(trip_session_id, "starting", "Processing your booking...");

    const paymentIntentId = session.stripe_payment_intent_id;
    const selectedFlights = session.selected_flights as any[] | null;
    const selectedHotels = session.selected_hotels as any[] | null;
    const selectedActivities = session.selected_activities as any[] | null;

    let flightOrderId: string | null = null;

    // --- Step 3: Book flights ---
    if (selectedFlights?.length) {
      const flight = selectedFlights[0];
      const passengers = flight.passengers ?? [
        {
          id: flight.passenger_id ?? crypto.randomUUID(),
          given_name: flight.passenger_name?.split(" ")[0] ?? "Traveler",
          family_name: flight.passenger_name?.split(" ").slice(1).join(" ") ?? "Guest",
          born_on: flight.passenger_dob ?? "1990-01-01",
          type: "adult",
          gender: flight.passenger_gender ?? "m",
          title: "mr",
          email: flight.passenger_email ?? session.user_email ?? "booking@traviso.ai",
          phone_number: flight.passenger_phone ?? "+1234567890",
        },
      ];

      const flightResult = await bookFlight(flight.booking_token, passengers);

      if (!flightResult.success) {
        // --- Step 4: Flight failed — full refund ---
        await supabase.from("booking_items").insert({
          trip_session_id: trip_session_id,
          type: "flight",
          provider_reference: null,
          status: "failed",
          amount_cents: flight.price_cents ?? 0,
          provider_response: { error: flightResult.error },
        });

        await failAndRefund(
          trip_session_id,
          paymentIntentId,
          `Flight booking failed: ${flightResult.error} — full refund issued`,
        );

        return new Response(JSON.stringify({ status: "failed", reason: "flight_booking_failed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      flightOrderId = flightResult.reference!;

      await supabase.from("booking_items").insert({
        trip_session_id: trip_session_id,
        type: "flight",
        provider_reference: flightResult.reference,
        status: "booked",
        amount_cents: flight.price_cents ?? 0,
        provider_response: { reference: flightResult.reference },
      });

      await logEvent(trip_session_id, "flight_confirmed", `Flight confirmed: ${flightResult.reference}`);
    }

    // --- Step 5: Book hotels ---
    if (selectedHotels?.length) {
      const hotel = selectedHotels[0];
      const holder = {
        name: hotel.holder_name?.split(" ")[0] ?? "Traveler",
        surname: hotel.holder_name?.split(" ").slice(1).join(" ") ?? "Guest",
      };

      const hotelResult = await bookHotel(hotel.booking_token, holder);

      if (!hotelResult.success) {
        // --- Step 6: Hotel failed — cancel flight, full refund ---
        await supabase.from("booking_items").insert({
          trip_session_id: trip_session_id,
          type: "hotel",
          provider_reference: null,
          status: "failed",
          amount_cents: hotel.total_price_cents ?? 0,
          provider_response: { error: hotelResult.error },
        });

        // Cancel the flight if it was booked
        if (flightOrderId) {
          await cancelFlight(flightOrderId);
          await logEvent(trip_session_id, "flight_cancelled", `Flight ${flightOrderId} cancelled due to hotel failure`);
        }

        await failAndRefund(
          trip_session_id,
          paymentIntentId,
          `Hotel booking failed: ${hotelResult.error} — all bookings cancelled, full refund issued`,
        );

        return new Response(JSON.stringify({ status: "failed", reason: "hotel_booking_failed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      await supabase.from("booking_items").insert({
        trip_session_id: trip_session_id,
        type: "hotel",
        provider_reference: hotelResult.reference,
        status: "booked",
        amount_cents: hotel.total_price_cents ?? 0,
        provider_response: { reference: hotelResult.reference },
      });

      await logEvent(trip_session_id, "hotel_confirmed", `Hotel confirmed: ${hotelResult.reference}`);
    }

    // Book activities (record only — Viator uses redirect booking)
    if (selectedActivities?.length) {
      for (const activity of selectedActivities) {
        await supabase.from("booking_items").insert({
          trip_session_id: trip_session_id,
          type: "activity",
          provider_reference: activity.booking_token ?? activity.id,
          status: "booked",
          amount_cents: activity.price_cents ?? 0,
          provider_response: {
            title: activity.title,
            booking_url: activity.booking_url,
          },
        });
      }

      await logEvent(
        trip_session_id,
        "activities_confirmed",
        `${selectedActivities.length} activit${selectedActivities.length === 1 ? "y" : "ies"} added to your trip`,
      );
    }

    // --- Step 7: Calculate creator commission ---
    if (session.user_id) {
      // Check if this trip was created from a creator's itinerary
      // Look for a creator_id in the session metadata or trip reference
      const creatorId = (session as any).creator_id ?? null;

      if (creatorId && session.total_amount_cents) {
        const creatorPercentage = 25;
        const creatorAmountCents = Math.floor(session.total_amount_cents * creatorPercentage / 100);
        const travisoMarginCents = session.total_amount_cents - creatorAmountCents;

        await supabase.from("commission_ledger").insert({
          trip_session_id: trip_session_id,
          creator_id: creatorId,
          booking_type: "exact_itinerary",
          amount_cents: session.total_amount_cents,
          creator_percentage: creatorPercentage,
          traviso_margin_cents: travisoMarginCents,
        });

        // Upsert creator earnings
        const { data: existingEarnings } = await supabase
          .from("creator_earnings")
          .select("pending_payout_cents")
          .eq("creator_id", creatorId)
          .single();

        if (existingEarnings) {
          await supabase
            .from("creator_earnings")
            .update({
              pending_payout_cents: existingEarnings.pending_payout_cents + creatorAmountCents,
              updated_at: new Date().toISOString(),
            })
            .eq("creator_id", creatorId);
        } else {
          await supabase.from("creator_earnings").insert({
            creator_id: creatorId,
            pending_payout_cents: creatorAmountCents,
            total_paid_out_cents: 0,
          });
        }

        await logEvent(
          trip_session_id,
          "commission_recorded",
          `Creator commission: $${(creatorAmountCents / 100).toFixed(2)} (${creatorPercentage}%)`,
        );
      }
    }

    // --- Step 8: Mark completed ---
    await supabase
      .from("trip_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", trip_session_id);

    // --- Step 9: Send confirmation email ---
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Load user profile for email
    let userEmail = "traveler@traviso.ai";
    if (session.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", session.user_id)
        .single();

      if (profile?.email) userEmail = profile.email;

      // Fire-and-forget email
      fetch(`${SUPABASE_URL}/functions/v1/send-notification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: "booking_confirmation",
          record: {
            trip_session_id: trip_session_id,
            user_id: session.user_id,
            user_email: userEmail,
            user_name: profile?.full_name ?? "Traveler",
            total_amount_cents: session.total_amount_cents,
            selected_flights: selectedFlights,
            selected_hotels: selectedHotels,
            selected_activities: selectedActivities,
          },
        }),
      }).catch((e) => console.error("[orchestrate] Email send failed:", e));
    }

    // --- Step 10: Final status ---
    await logEvent(trip_session_id, "completed", "Your trip is confirmed!");

    console.log(`[orchestrate] Trip ${trip_session_id} completed successfully`);

    return new Response(JSON.stringify({ status: "completed", trip_session_id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[orchestrate] Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
