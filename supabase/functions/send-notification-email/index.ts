import { createClient } from "npm:@supabase/supabase-js@2";
import { sendLovableEmail } from "npm:@lovable.dev/email-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_NAME = "Traviso";
const SENDER_DOMAIN = "notify.traviso.ai";
const FROM_DOMAIN = "traviso.ai";

interface NotificationEmailPayload {
  type: "booking_confirmation" | "new_follower" | "new_review" | "group_invite";
  record: Record<string, unknown>;
}

function buildGroupInviteHtml(inviterName: string, tripTitle: string, inviteLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo-email.png" alt="Traviso" style="height:32px;" />
    </div>
    <div style="background:#f8faf9;border-radius:16px;padding:32px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">✈️</div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">You're invited to plan a trip!</h1>
      <p style="font-size:15px;color:#666;margin:0 0 20px;line-height:1.5;">
        <strong style="color:#1a1a1a;">${inviterName}</strong> wants you to join the group for <strong style="color:#1a1a1a;">"${tripTitle}"</strong> on Traviso.
      </p>
      <p style="font-size:14px;color:#888;margin:0 0 24px;">
        Vote on activities, help decide the itinerary, and split costs together.
      </p>
      <a href="${inviteLink}" style="display:inline-block;background:#29A38B;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Join Trip Group →
      </a>
    </div>
    <p style="text-align:center;font-size:12px;color:#aaa;margin-top:24px;">
      If you didn't expect this invite, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

function buildBookingHtml(bookerName: string, tripTitle: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;text-align:center;">
    <img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo-email.png" alt="Traviso" style="height:32px;margin-bottom:24px;" />
    <h1 style="font-size:22px;color:#1a1a1a;">🎉 New Booking!</h1>
    <p style="font-size:15px;color:#666;">${bookerName} just booked your trip "${tripTitle}".</p>
  </div>
</body>
</html>`;
}

function buildFollowHtml(followerName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;text-align:center;">
    <img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo-email.png" alt="Traviso" style="height:32px;margin-bottom:24px;" />
    <h1 style="font-size:22px;color:#1a1a1a;">👋 New Follower!</h1>
    <p style="font-size:15px;color:#666;">${followerName} started following you on Traviso.</p>
  </div>
</body>
</html>`;
}

function buildReviewHtml(reviewerName: string, tripTitle: string, rating: number, comment?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;text-align:center;">
    <img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo-email.png" alt="Traviso" style="height:32px;margin-bottom:24px;" />
    <h1 style="font-size:22px;color:#1a1a1a;">⭐ New ${rating}-Star Review</h1>
    <p style="font-size:15px;color:#666;">${reviewerName} reviewed "${tripTitle}".</p>
    ${comment ? `<p style="font-size:14px;color:#888;font-style:italic;">"${comment}"</p>` : ""}
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: NotificationEmailPayload = await req.json();
    const { type, record } = payload;

    console.log(`[Notification Email] Type: ${type}`, JSON.stringify(record));

    let recipientEmail: string | null = null;
    let subject = "";
    let html = "";

    if (type === "group_invite") {
      // Send invite email to the invited person
      const email = record.email as string;
      const tripId = record.trip_id as string;
      const inviteToken = record.invite_token as string;
      const inviterId = record.invited_by as string;

      if (!email || !tripId || !inviteToken) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for group invite" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get inviter name
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", inviterId)
        .single();

      // Get trip title
      const { data: trip } = await supabase
        .from("trips")
        .select("title")
        .eq("id", tripId)
        .single();

      const inviterName = inviterProfile?.display_name || "Someone";
      const tripTitle = trip?.title || "a trip";
      // Use published URL for invite links
      const inviteLink = `https://traviso.lovable.app/trip/${tripId}?invite=${inviteToken}`;

      recipientEmail = email;
      subject = `${inviterName} invited you to plan "${tripTitle}" ✈️`;
      html = buildGroupInviteHtml(inviterName, tripTitle, inviteLink);

    } else if (type === "booking_confirmation" && record.trip_id && record.user_id) {
      const { data: bookerProfile } = await supabase
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
          subject = `🎉 New booking on "${trip.title}"`;
          html = buildBookingHtml(bookerProfile?.display_name || "Someone", trip.title);
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
        html = buildFollowHtml(follower?.display_name || "Someone");
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
          html = buildReviewHtml(
            reviewer?.display_name || "Someone",
            trip.title,
            record.rating as number,
            record.comment as string | undefined
          );
        }
      }
    }

    // Actually send the email via Lovable Email API
    if (recipientEmail && html) {
      console.log(`[Sending Email] To: ${recipientEmail}, Subject: ${subject}`);

      try {
        const result = await sendLovableEmail(
          {
            run_id: crypto.randomUUID(),
            to: recipientEmail,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: subject,
            purpose: "transactional",
          },
          { apiKey }
        );
        console.log(`[Email Sent] message_id: ${result.message_id}`);
      } catch (emailError) {
        console.error("[Email Send Failed]", emailError);
        // Don't fail the whole request — log and continue
      }
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: !!recipientEmail }),
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
