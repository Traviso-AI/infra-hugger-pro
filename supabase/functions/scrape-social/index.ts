import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Resolve short URLs (e.g. tiktok.com/t/xxx) to full URLs
async function resolveRedirects(url: string): Promise<string> {
  try {
    const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
    return resp.url || url;
  } catch {
    return url;
  }
}

// TikTok oEmbed — free, no API key needed
async function tryTikTokOEmbed(url: string): Promise<{ title: string; author: string; thumbnail: string } | null> {
  try {
    // Resolve short URLs first
    let resolvedUrl = url;
    if (url.includes("/t/") || url.includes("vm.tiktok.com")) {
      resolvedUrl = await resolveRedirects(url);
    }
    
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
    console.log("[scrape-social] Trying TikTok oEmbed:", oembedUrl);
    
    const resp = await fetch(oembedUrl);
    if (!resp.ok) {
      console.log("[scrape-social] TikTok oEmbed failed:", resp.status);
      return null;
    }
    
    const data = await resp.json();
    return {
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch (e) {
    console.error("[scrape-social] TikTok oEmbed error:", e);
    return null;
  }
}

// Try Firecrawl for non-blocked sites (YouTube, blogs, etc.)
async function tryFirecrawl(url: string, apiKey: string): Promise<{ markdown: string; title: string; description: string } | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await resp.json();
    if (!resp.ok || data.success === false) {
      console.log("[scrape-social] Firecrawl failed:", resp.status, data.error);
      return null;
    }

    return {
      markdown: data.data?.markdown || data.markdown || "",
      title: data.data?.metadata?.title || data.metadata?.title || "",
      description: data.data?.metadata?.description || data.metadata?.description || "",
    };
  } catch (e) {
    console.error("[scrape-social] Firecrawl error:", e);
    return null;
  }
}

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

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("[scrape-social] Processing URL:", formattedUrl);

    const isTikTok = /tiktok\.com/i.test(formattedUrl);
    const isInstagram = /instagram\.com/i.test(formattedUrl);

    let content = "";
    let title = "";
    let description = "";

    // Strategy 1: TikTok oEmbed (free, no key needed)
    if (isTikTok) {
      const oembed = await tryTikTokOEmbed(formattedUrl);
      if (oembed && oembed.title) {
        title = oembed.title;
        description = `TikTok video by @${oembed.author}`;
        content = `# TikTok Video by @${oembed.author}\n\n**Caption:** ${oembed.title}\n\nSource: ${formattedUrl}`;
        console.log(`[scrape-social] TikTok oEmbed success: "${title}" by @${oembed.author}`);
      }
    }

    // Strategy 2: Instagram — try Firecrawl search as workaround
    if (isInstagram && !content) {
      const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (apiKey) {
        try {
          const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `site:instagram.com ${formattedUrl}`,
              limit: 3,
            }),
          });
          const searchData = await searchResp.json();
          if (searchResp.ok && searchData.data?.length > 0) {
            const r = searchData.data[0];
            title = r.title || "";
            description = r.description || "";
            content = `# Instagram Post\n\n**Title:** ${title}\n**Description:** ${description}\n\nSource: ${formattedUrl}`;
          }
        } catch (e) {
          console.log("[scrape-social] Instagram search fallback failed:", e);
        }
      }
    }

    // Strategy 3: For other sites (YouTube, blogs, etc.) — use Firecrawl directly
    if (!content && !isTikTok && !isInstagram) {
      const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (apiKey) {
        const result = await tryFirecrawl(formattedUrl, apiKey);
        if (result && result.markdown) {
          content = result.markdown;
          title = result.title;
          description = result.description;
        }
      }
    }

    // If nothing worked, return minimal context
    if (!content && !title) {
      console.log("[scrape-social] All extraction methods failed for:", formattedUrl);
      return new Response(
        JSON.stringify({
          success: true,
          content: "",
          title: "",
          description: "",
          sourceUrl: formattedUrl,
          extractionFailed: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[scrape-social] Success — ${content.length} chars, title: "${title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        content: content,
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
