import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let sql = `-- TRAVISO FULL DATABASE EXPORT\n-- Generated: ${new Date().toISOString()}\n-- Import order: profiles → user_roles → trips → trip_days → trip_activities → hotel_inventory → bookings\n\n`;

  const escapeStr = (s: string | null) => {
    if (s === null || s === undefined) return "NULL";
    return "'" + String(s).replace(/'/g, "''") + "'";
  };

  const formatVal = (v: any) => {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return `ARRAY[${v.map((i: string) => escapeStr(i)).join(",")}]`;
    if (typeof v === "object") return escapeStr(JSON.stringify(v));
    return escapeStr(String(v));
  };

  const exportTable = async (tableName: string, columns: string[]) => {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      sql += `-- ERROR exporting ${tableName}: ${error.message}\n\n`;
      return;
    }
    if (!data || data.length === 0) {
      sql += `-- ${tableName}: No data\n\n`;
      return;
    }
    sql += `-- ${tableName} (${data.length} rows)\n`;
    for (const row of data) {
      const vals = columns.map((c) => formatVal(row[c]));
      sql += `INSERT INTO public.${tableName} (${columns.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += "\n";
  };

  await exportTable("profiles", ["id","user_id","display_name","avatar_url","bio","username","is_creator","total_earnings","twitter","instagram","website","created_at","updated_at"]);
  await exportTable("user_roles", ["id","user_id","role"]);
  await exportTable("trips", ["id","creator_id","title","description","destination","duration_days","cover_image_url","tags","is_published","is_featured","avg_rating","total_bookings","total_favorites","total_revenue","commission_rate","price_estimate","created_at","updated_at"]);
  await exportTable("trip_days", ["id","trip_id","day_number","title","description","created_at"]);
  await exportTable("trip_activities", ["id","trip_day_id","title","type","description","location","start_time","end_time","price_estimate","booking_url","image_url","sort_order","metadata","created_at"]);
  await exportTable("hotel_inventory", ["id","name","destination","description","price_per_night","star_rating","amenities","available","image_url","location_lat","location_lng","created_at"]);
  await exportTable("bookings", ["id","user_id","trip_id","hotel_id","check_in","check_out","guests","total_price","commission_amount","status","stripe_payment_id","created_at","updated_at"]);
  await exportTable("favorites", ["id","user_id","trip_id","created_at"]);
  await exportTable("reviews", ["id","user_id","trip_id","rating","comment","created_at"]);
  await exportTable("messages", ["id","user_id","conversation_id","role","content","metadata","created_at"]);

  return new Response(sql, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/sql",
      "Content-Disposition": "attachment; filename=traviso-export.sql",
    },
  });
});
