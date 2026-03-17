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

    // Verify JWT and get user
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
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    const creatorEmail = email || user.email;

    if (!creatorEmail) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB writes
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check if creator already has a Connect account
    const { data: existingEarnings } = await adminSupabase
      .from("creator_earnings")
      .select("stripe_connect_account_id")
      .eq("creator_id", user.id)
      .single();

    if (existingEarnings?.stripe_connect_account_id) {
      // Account exists — create a new login link instead
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

      const loginLink = await stripe.accounts.createLoginLink(
        existingEarnings.stripe_connect_account_id,
      );

      return new Response(JSON.stringify({ url: loginLink.url, existing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new Stripe Connect Express account
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    const account = await stripe.accounts.create({
      type: "express",
      email: creatorEmail,
      metadata: {
        user_id: user.id,
        platform: "traviso",
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    console.log(`[create-connect-account] Created Stripe Connect account: ${account.id} for user: ${user.id}`);

    // Save account ID to creator_earnings
    const { error: upsertError } = await adminSupabase
      .from("creator_earnings")
      .upsert(
        {
          creator_id: user.id,
          stripe_connect_account_id: account.id,
          pending_payout_cents: 0,
          total_paid_out_cents: 0,
        },
        { onConflict: "creator_id" },
      );

    if (upsertError) {
      console.error("[create-connect-account] Failed to save account ID:", upsertError);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://app.traviso.ai/creator-earnings?refresh=true",
      return_url: "https://app.traviso.ai/creator-earnings?connected=true",
      type: "account_onboarding",
    });

    return new Response(JSON.stringify({ url: accountLink.url, account_id: account.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-connect-account] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
