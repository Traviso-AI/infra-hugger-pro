import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationEmailPayload {
  type: "booking_confirmation" | "new_follower" | "new_review";
  record: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: NotificationEmailPayload = await req.json();
    const { type, record } = payload;

    // Log the notification event for now - actual email sending 
    // would require a transactional email service integration
    console.log(`[Notification Email] Type: ${type}`, JSON.stringify(record));

    let recipientEmail: string | null = null;
    let subject = "";
    let body = "";

    if (type === "booking_confirmation" && record.trip_id && record.user_id) {
      // Get booker info
      const { data: bookerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", record.user_id)
        .single();

      // Get trip and creator info
      const { data: trip } = await supabase
        .from("trips")
        .select("title, creator_id")
        .eq("id", record.trip_id)
        .single();

      if (trip) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("display_name, user_id")
          .eq("user_id", trip.creator_id)
          .single();

        // Get creator's email from auth
        const { data: { user: creatorUser } } = await supabase.auth.admin.getUserById(trip.creator_id);

        if (creatorUser?.email) {
          recipientEmail = creatorUser.email;
          subject = `🎉 New booking on "${trip.title}"`;
          body = `${bookerProfile?.display_name || "Someone"} just booked your trip "${trip.title}"! Check your dashboard for details.`;
        }
      }
    } else if (type === "new_follower" && record.follower_id && record.following_id) {
      const { data: follower } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", record.follower_id)
        .single();

      const { data: { user: followedUser } } = await supabase.auth.admin.getUserById(record.following_id as string);

      if (followedUser?.email) {
        recipientEmail = followedUser.email;
        subject = `👋 ${follower?.display_name || "Someone"} started following you`;
        body = `${follower?.display_name || "Someone"} is now following you on Traviso! Check out their profile.`;
      }
    } else if (type === "new_review" && record.trip_id && record.user_id) {
      const { data: reviewer } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", record.user_id)
        .single();

      const { data: trip } = await supabase
        .from("trips")
        .select("title, creator_id")
        .eq("id", record.trip_id)
        .single();

      if (trip) {
        const { data: { user: creatorUser } } = await supabase.auth.admin.getUserById(trip.creator_id);

        if (creatorUser?.email) {
          recipientEmail = creatorUser.email;
          subject = `⭐ New ${record.rating}-star review on "${trip.title}"`;
          body = `${reviewer?.display_name || "Someone"} left a ${record.rating}-star review on your trip "${trip.title}". ${record.comment ? `"${record.comment}"` : ""}`;
        }
      }
    }

    // For now, log the email that would be sent
    // A transactional email service (like Resend) can be integrated later
    if (recipientEmail) {
      console.log(`[Email Ready] To: ${recipientEmail}, Subject: ${subject}, Body: ${body}`);
    }

    return new Response(
      JSON.stringify({ success: true, email_queued: !!recipientEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Notification email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});