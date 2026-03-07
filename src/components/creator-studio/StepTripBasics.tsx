import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CoverImageUpload } from "./CoverImageUpload";
import { TagSelector } from "./TagSelector";
import { DestinationAutocomplete } from "./DestinationAutocomplete";
import { Info } from "lucide-react";

export interface TripBasicsData {
  title: string;
  destination: string;
  description: string;
  durationDays: string;
  priceEstimate: string;
  tags: string[];
  coverImageUrl: string | null;
}

interface StepTripBasicsProps {
  data: TripBasicsData;
  onChange: (data: TripBasicsData) => void;
}

export function StepTripBasics({ data, onChange }: StepTripBasicsProps) {
  const update = (field: keyof TripBasicsData, value: any) => {
    onChange({ ...data, [field]: value });
  };


  return (
    <div className="space-y-6">
      <CoverImageUpload
        imageUrl={data.coverImageUrl}
        onImageUploaded={(url) => update("coverImageUrl", url)}
        onImageRemoved={() => update("coverImageUrl", null)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Trip Title</Label>
          <Input
            placeholder="3 Days in Tokyo"
            value={data.title}
            onChange={(e) => update("title", e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Destination</Label>
          <DestinationAutocomplete
            value={data.destination}
            onChange={(v) => update("destination", v)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>What makes this trip special?</Label>
          <Textarea
            placeholder="Describe what travelers will experience..."
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Duration (days)</Label>
          <Input
            type="number"
            min="1"
            placeholder="3"
            value={data.durationDays}
            onChange={(e) => update("durationDays", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 rounded-lg bg-accent/5 border border-accent/15 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            💡 Your trip price is automatically calculated from your flights, hotels, activities, and experiences added in Step 2. You'll review the total before publishing.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagSelector selected={data.tags} onChange={(tags) => update("tags", tags)} />
      </div>
    </div>
  );
}
