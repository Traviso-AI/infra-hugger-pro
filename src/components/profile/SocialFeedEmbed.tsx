import { useState } from "react";
import { Instagram, ExternalLink } from "lucide-react";

interface SocialFeedEmbedProps {
  instagram?: string | null;
  twitter?: string | null;
}

export function SocialFeedEmbed({ instagram, twitter }: SocialFeedEmbedProps) {
  const [igLoaded, setIgLoaded] = useState(false);
  const [tiktokHandle] = useState<string | null>(null); // Future: pass as prop

  if (!instagram && !twitter) return null;

  const igHandle = instagram?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  const twitterHandle = twitter?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "").replace(/\/.*$/, "");

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
          {/* Instagram embed iframe */}
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

      {/* X / Twitter Link Card */}
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
          <div className="flex-1">
            <p className="text-sm font-medium group-hover:text-accent transition-colors">@{twitterHandle}</p>
            <p className="text-xs text-muted-foreground">X / Twitter</p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      )}

      {/* TikTok embed placeholder - future */}
      {tiktokHandle && (
        <div className="rounded-xl border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.28 0 .56.04.82.12v-3.5a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.4 6.34 6.34 0 0 0 9.49 21.7a6.34 6.34 0 0 0 6.34-6.34V8.82a8.22 8.22 0 0 0 4.78 1.52V6.89a4.85 4.85 0 0 1-1.02-.2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">@{tiktokHandle}</p>
              <p className="text-xs text-muted-foreground">TikTok</p>
            </div>
          </div>
          <iframe
            src={`https://www.tiktok.com/embed/@${tiktokHandle}`}
            className="w-full border-0"
            height="500"
            title={`TikTok feed for @${tiktokHandle}`}
          />
        </div>
      )}
    </div>
  );
}