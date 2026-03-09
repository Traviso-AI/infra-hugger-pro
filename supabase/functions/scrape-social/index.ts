import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Scraping service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("[scrape-social] Scraping URL:", formattedUrl);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[scrape-social] Firecrawl error:", response.status, data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Scrape failed (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = data.data?.markdown || data.markdown || "";
    const title = data.data?.metadata?.title || data.metadata?.title || "";
    const description = data.data?.metadata?.description || data.metadata?.description || "";

    console.log(`[scrape-social] Scraped ${markdown.length} chars, title: "${title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        content: markdown,
        title,
        description,
        sourceUrl: formattedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[scrape-social] Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to scrape";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
