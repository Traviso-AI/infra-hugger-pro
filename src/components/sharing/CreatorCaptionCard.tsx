import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CreatorCaptionCardProps {
  label: string;
  caption: string;
}

export function CreatorCaptionCard({ label, caption }: CreatorCaptionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{caption}</p>
    </div>
  );
}
