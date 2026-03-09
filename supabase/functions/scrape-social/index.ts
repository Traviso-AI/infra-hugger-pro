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

    // Try direct scrape first
    let markdown = "";
    let title = "";
    let description = "";

    const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
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

    const scrapeData = await scrapeResp.json();

    if (scrapeResp.ok && scrapeData.success !== false) {
      markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";
      description = scrapeData.data?.metadata?.description || scrapeData.metadata?.description || "";
    } else {
      // Firecrawl doesn't support this site (e.g. TikTok, Instagram) — fall back to search
      console.log("[scrape-social] Direct scrape failed, falling back to search for:", formattedUrl);

      const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: formattedUrl,
          limit: 5,
        }),
      });

      const searchData = await searchResp.json();

      if (searchResp.ok && searchData.data && searchData.data.length > 0) {
        const results = searchData.data;
        title = results[0]?.title || results[0]?.metadata?.title || "";
        description = results[0]?.description || results[0]?.metadata?.description || "";
        markdown = results
          .map((r: any, i: number) => {
            const t = r.title || r.metadata?.title || `Result ${i + 1}`;
            const content = r.markdown || r.description || "";
            return `## ${t}\n\n${content}`;
          })
          .join("\n\n---\n\n");
        console.log(`[scrape-social] Search fallback found ${results.length} results`);
      } else {
        console.log("[scrape-social] Search fallback also returned no results, returning URL-only context");
        // Return success with minimal context so the AI can still try
        markdown = "";
        title = "";
        description = `Social media post from: ${formattedUrl}`;
      }
    }

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
