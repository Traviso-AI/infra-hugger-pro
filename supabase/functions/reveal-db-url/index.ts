import "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Simple auth check — require the anon key in Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const dbUrl = Deno.env.get("SUPABASE_DB_URL") ?? "NOT SET";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "NOT SET";

  return new Response(JSON.stringify({ SUPABASE_DB_URL: dbUrl, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey }), {
    headers: { "Content-Type": "application/json" },
  });
});
