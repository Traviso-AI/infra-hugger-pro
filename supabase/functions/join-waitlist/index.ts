import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, source } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Send to Loops only — admin manually approves via whitelist
    const loopsApiKey = Deno.env.get("LOOPS_API_KEY");
    let loopsResult = null;

    if (loopsApiKey) {
      try {
        loopsResult = await fetch("https://app.loops.so/api/v1/contacts/create", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${loopsApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            firstName: fullName?.split(" ")[0] || "",
            lastName: fullName?.split(" ").slice(1).join(" ") || "",
            source: source || "app_signup",
            userGroup: "Waitlist",
          }),
        });
      } catch (e) {
        console.error("Loops API error:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
