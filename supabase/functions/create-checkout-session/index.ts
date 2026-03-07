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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { trip_id, hotel_id, check_in, check_out, guests, total_price } = await req.json();

    if (!trip_id || !total_price) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch trip details for line item description
    const { data: trip } = await supabase
      .from("trips")
      .select("title, destination")
      .eq("id", trip_id)
      .single();

    const tripName = trip ? `${trip.title} - ${trip.destination}` : "Trip Booking";

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists for this email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || "https://infra-hugger-pro.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      currency: "usd",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(total_price * 100),
            product_data: {
              name: tripName,
              description: `${check_in} to ${check_out} · ${guests} guest${guests > 1 ? "s" : ""}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&trip_id=${trip_id}&hotel_id=${hotel_id || ""}&check_in=${check_in}&check_out=${check_out}&guests=${guests}&total_price=${total_price}`,
      cancel_url: `${origin}/booking/${trip_id}`,
      metadata: {
        user_id: user.id,
        trip_id,
        hotel_id: hotel_id || "",
        check_in,
        check_out,
        guests: String(guests),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
