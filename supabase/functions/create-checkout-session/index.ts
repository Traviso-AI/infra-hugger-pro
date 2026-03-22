import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    console.log("[checkout] Auth header:", authHeader ? authHeader.substring(0, 50) + "..." : "MISSING");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode JWT directly without validation (Supabase edge runtime handles verification)
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const user = { id: payload.sub, email: payload.email };
    console.log("[checkout] Decoded user:", user.id, user.email);
    if (!user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { trip_session_id, traveler } = await req.json();
    console.log("[checkout] Body received:", trip_session_id, JSON.stringify(traveler));

    try {
    if (!trip_session_id) {
      return new Response(JSON.stringify({ error: "Missing trip_session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session, error: sessionError } = await supabase
      .from("trip_sessions" as any)
      .select("*")
      .eq("id", trip_session_id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      console.error("Trip session load error:", sessionError);
      return new Response(JSON.stringify({ error: "Trip session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (traveler) {
      const updatedFlights = ((session as any).selected_flights ?? []).map((f: any) => ({
        ...f,
        passenger_name: `${traveler.first_name} ${traveler.last_name}`,
        passenger_email: traveler.email ?? user.email,
        passenger_phone: traveler.phone ? traveler.phone.replace(/[^\d+]/g, "").replace(/^\+?/, "+") : "+12065551234",
        passenger_dob: "1990-01-01",
      }));
      const updatedHotels = ((session as any).selected_hotels ?? []).map((h: any) => ({
        ...h,
        holder_name: `${traveler.first_name} ${traveler.last_name}`,
      }));
      await supabase
        .from("trip_sessions" as any)
        .update({
          selected_flights: updatedFlights,
          selected_hotels: updatedHotels,
          traveler_info: { ...((session as any).traveler_info ?? {}), ...traveler },
          updated_at: new Date().toISOString(),
        })
        .eq("id", trip_session_id);
    }

    const flights = (session as any).selected_flights ?? [];
    const hotels = (session as any).selected_hotels ?? [];
    const activities = (session as any).selected_activities ?? [];
    const lineItems: any[] = [];

    if (flights[0]) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: flights[0].price_cents,
          product_data: {
            name: `${flights[0].airline_name} Flight${flights[0].flight_number ? " " + flights[0].flight_number : ""}`,
            description: `${flights[0].cabin_class ?? "economy"} · ${flights[0].stops === 0 ? "Nonstop" : flights[0].stops + " stop(s)"}`,
          },
        },
        quantity: 1,
      });
    }

    if (hotels[0]) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: hotels[0].total_price_cents,
          product_data: {
            name: hotels[0].name,
            description: hotels[0].cancellation_policy ?? "",
          },
        },
        quantity: 1,
      });
    }

    for (const activity of activities) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: activity.price_cents,
          product_data: { name: activity.title },
        },
        quantity: 1,
      });
    }

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: "No bookable items in session" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/") || "http://localhost:8080";

    console.log("[checkout] Creating Stripe session with trip_session_id:", trip_session_id, "origin:", origin);
    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "payment",
      currency: "usd",
      line_items: lineItems,
      success_url: `${origin}/booking/progress?trip_session_id=${trip_session_id}`,
      cancel_url: `${origin}/ai-planner`,
      metadata: {
        trip_session_id,
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: stripeSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    } catch (innerErr: any) {
      console.error("[checkout] Inner error:", innerErr?.message, innerErr?.stack);
      return new Response(JSON.stringify({ error: innerErr?.message ?? "Unknown error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("create-checkout-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
