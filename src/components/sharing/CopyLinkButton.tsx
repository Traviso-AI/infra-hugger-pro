import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
      <input
        readOnly
        value={link}
        className="flex-1 bg-transparent text-xs text-muted-foreground truncate outline-none"
      />
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 gap-1.5 text-xs"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-500" />
            Copied! ✓
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
