import { useState } from "react";
import { Instagram, ExternalLink, MessageCircle } from "lucide-react";

interface SocialFeedEmbedProps {
  instagram?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
}

export function SocialFeedEmbed({ instagram, twitter, tiktok, whatsapp }: SocialFeedEmbedProps) {
  const [igLoaded, setIgLoaded] = useState(false);

  if (!instagram && !twitter && !tiktok && !whatsapp) return null;

  const igHandle = instagram?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  const twitterHandle = twitter?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "").replace(/\/.*$/, "");
  const tiktokHandle = tiktok?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/, "").replace(/\/.*$/, "");
  // WhatsApp: accept wa.me links, full URLs, or just the slug
  const waLink = whatsapp?.replace(/^https?:\/\//, "").replace(/^wa\.me\//, "").replace(/^chat\.whatsapp\.com\//, "").replace(/\/.*$/, "").trim();
  const waUrl = whatsapp?.includes("chat.whatsapp.com") 
    ? `https://chat.whatsapp.com/${waLink}` 
    : `https://wa.me/${waLink}`;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Social</h3>

      {/* Instagram Embed */}
      {igHandle && (
        <div className="rounded-xl border overflow-hidden">
          <a
            href={`https://instagram.com/${igHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group border-b"
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium group-hover:text-accent transition-colors">@{igHandle}</p>
              <p className="text-xs text-muted-foreground">Instagram</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <div className="relative bg-muted/30">
            {!igLoaded && (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-2">
                  <Instagram className="h-8 w-8 text-muted-foreground/40 mx-auto animate-pulse" />
                  <p className="text-xs text-muted-foreground">Loading Instagram feed...</p>
                </div>
              </div>
            )}
            <iframe
              src={`https://www.instagram.com/${igHandle}/embed`}
              className={`w-full border-0 transition-opacity duration-300 ${igLoaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
              height="480"
              allowTransparency
              scrolling="no"
              onLoad={() => setIgLoaded(true)}
              title={`Instagram feed for @${igHandle}`}
            />
          </div>
        </div>
      )}

      {/* Link cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* X / Twitter */}
        {twitterHandle && (
          <a
            href={`https://x.com/${twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-background" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-accent transition-colors truncate">@{twitterHandle}</p>
              <p className="text-xs text-muted-foreground">X / Twitter</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        )}

        {/* TikTok */}
        {tiktokHandle && (
          <a
            href={`https://tiktok.com/@${tiktokHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-background" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.12v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.4 6.34 6.34 0 0 0 9.49 21.7a6.34 6.34 0 0 0 6.34-6.34V8.82a8.22 8.22 0 0 0 4.78 1.52V6.89a4.85 4.85 0 0 1-1.02-.2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-accent transition-colors truncate">@{tiktokHandle}</p>
              <p className="text-xs text-muted-foreground">TikTok</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        )}

        {/* WhatsApp */}
        {waLink && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 rounded-lg bg-[#25D366] flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-accent transition-colors truncate">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Message me</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        )}
      </div>
    </div>
  );
}
