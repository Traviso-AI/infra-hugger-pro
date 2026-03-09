import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getDestinationCover } from "@/lib/destination-covers";
import { cn } from "@/lib/utils";

interface TripPhotoGalleryProps {
  coverImage?: string | null;
  destination: string;
  tripId: string;
  activityImages?: string[];
}

export function TripPhotoGallery({ coverImage, destination, tripId, activityImages = [] }: TripPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allImages: string[] = [];
  if (coverImage) allImages.push(coverImage);
  activityImages.forEach((img) => { if (img) allImages.push(img); });

  const destinationCovers = Array.from({ length: 4 }, (_, i) =>
    getDestinationCover(destination, 1200, 600, `${tripId}-${i}`)
  );
  const uniqueCovers = [...new Set(destinationCovers)];
  uniqueCovers.forEach((c) => { if (!allImages.includes(c)) allImages.push(c); });

  const photos = allImages.slice(0, 6);
  const mainPhoto = photos[0] || getDestinationCover(destination, 1200, 600, tripId);

  const openLightbox = (idx: number) => {
    setActiveIndex(idx);
    setLightboxOpen(true);
  };

  const navigate = (dir: number) => {
    setActiveIndex((prev) => (prev + dir + photos.length) % photos.length);
  };

  if (photos.length <= 1) {
    return (
      <>
        <div className="relative h-64 md:h-96 bg-muted cursor-pointer" onClick={() => openLightbox(0)}>
          <img src={mainPhoto} alt={destination} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
        <LightboxDialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          photos={[mainPhoto]}
          activeIndex={0}
          onNavigate={navigate}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative h-64 md:h-96 bg-muted">
        <div className="grid h-full gap-1 md:gap-1.5" style={{
          gridTemplateColumns: photos.length >= 3 ? "2fr 1fr" : "1fr 1fr",
          gridTemplateRows: photos.length >= 4 ? "1fr 1fr" : "1fr",
        }}>
          <div
            className={cn("relative cursor-pointer overflow-hidden", photos.length >= 3 && "row-span-2")}
            onClick={() => openLightbox(0)}
          >
            <img src={photos[0]} alt={destination} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
          {photos.slice(1, photos.length >= 4 ? 3 : 2).map((photo, i) => (
            <div key={i} className="relative cursor-pointer overflow-hidden" onClick={() => openLightbox(i + 1)}>
              <img src={photo} alt={`${destination} ${i + 2}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
              {i === (photos.length >= 4 ? 1 : 0) && photos.length > 3 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{photos.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
      </div>

      <LightboxDialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={photos}
        activeIndex={activeIndex}
        onNavigate={navigate}
      />
    </>
  );
}

function LightboxDialog({
  open, onClose, photos, activeIndex, onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  photos: string[];
  activeIndex: number;
  onNavigate: (dir: number) => void;
}) {
  if (!open) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] rounded-lg overflow-hidden focus:outline-none"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Photo viewer</DialogPrimitive.Title>
          </VisuallyHidden>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute right-3 top-3 z-[60] h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="relative flex items-center justify-center min-h-[60vh] bg-black/95">
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate(-1)}
                  className="absolute left-4 z-10 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(1)}
                  className="absolute right-4 z-10 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            <img
              src={photos[activeIndex]}
              alt={`Photo ${activeIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
            />

            {photos.length > 1 && (
              <div className="absolute bottom-4 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onNavigate(i - activeIndex)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors",
                      i === activeIndex ? "bg-white" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}