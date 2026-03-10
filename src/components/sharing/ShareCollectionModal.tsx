import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareCollectionModalProps {
  collectionId: string;
  collectionName: string;
}

const BASE_URL = "https://app.traviso.ai";

export function ShareCollectionModal({ collectionId, collectionName }: ShareCollectionModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const shareLink = `${BASE_URL}/collections/shared/${collectionId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${collectionName} — Traviso AI`,
          text: `Check out my travel collection: ${collectionName}`,
          url: shareLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const content = (
    <div className="space-y-4 p-1">
      <DialogHeader className="text-center">
        <DialogTitle className="font-display text-lg font-bold">Share Collection</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mt-1">
          Share "{collectionName}" with friends and fellow travelers
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
        <p className="flex-1 text-sm truncate text-muted-foreground">{shareLink}</p>
        <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="text-xs"
          onClick={() => {
            window.open(
              `https://wa.me/?text=${encodeURIComponent(`Check out my travel collection: ${collectionName} ${shareLink}`)}`,
              "_blank"
            );
          }}
        >
          WhatsApp
        </Button>
        <Button
          variant="outline"
          className="text-xs"
          onClick={() => {
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my travel collection: ${collectionName}`)}&url=${encodeURIComponent(shareLink)}`,
              "_blank"
            );
          }}
        >
          X / Twitter
        </Button>
        <Button
          variant="outline"
          className="text-xs"
          onClick={() => {
            window.open(
              `mailto:?subject=${encodeURIComponent(`${collectionName} — Travel Collection`)}&body=${encodeURIComponent(`Check out my travel collection on Traviso AI: ${shareLink}`)}`,
              "_blank"
            );
          }}
        >
          Email
        </Button>
      </div>

      {navigator.share && (
        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={handleNativeShare}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share via...
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-4 pb-6">
            <div className="pt-4">{content}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-sm"
          onPointerDownOutside={(e) => e.stopPropagation()}
          onInteractOutside={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}
