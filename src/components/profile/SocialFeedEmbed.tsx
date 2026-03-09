import { Instagram } from "lucide-react";

interface SocialFeedEmbedProps {
  instagram?: string | null;
  twitter?: string | null;
}

export function SocialFeedEmbed({ instagram, twitter }: SocialFeedEmbedProps) {
  if (!instagram && !twitter) return null;

  const igHandle = instagram?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
  const twitterHandle = twitter?.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "").replace(/\/.*$/, "");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">Social</h3>
      <div className="flex flex-wrap gap-3">
        {igHandle && (
          <a
            href={`https://instagram.com/${igHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-accent transition-colors">@{igHandle}</p>
              <p className="text-xs text-muted-foreground">Instagram</p>
            </div>
          </a>
        )}
        {twitterHandle && (
          <a
            href={`https://x.com/${twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="h-9 w-9 rounded-lg bg-foreground flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-background" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-accent transition-colors">@{twitterHandle}</p>
              <p className="text-xs text-muted-foreground">X / Twitter</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
