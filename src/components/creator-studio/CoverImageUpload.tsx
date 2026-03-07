import { useState, useCallback } from "react";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoverImageUploadProps {
  imageUrl: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

export function CoverImageUpload({ imageUrl, onImageUploaded, onImageRemoved }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("trip-images").upload(path, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("trip-images").getPublicUrl(path);
      onImageUploaded(publicUrl);
      toast.success("Cover image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all overflow-hidden",
        dragOver ? "border-accent bg-accent/5" : "border-muted-foreground/25 hover:border-accent/50",
        imageUrl ? "aspect-[16/7]" : "aspect-[16/7]"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button
            onClick={onImageRemoved}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <label className="absolute bottom-3 right-3 cursor-pointer px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-xs font-medium hover:bg-background transition-colors flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" />
            Change
            <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center h-full cursor-pointer gap-3 p-6">
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            ) : (
              <Upload className="h-6 w-6 text-accent" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Cover Photo"}</p>
            <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse • Max 5MB</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
