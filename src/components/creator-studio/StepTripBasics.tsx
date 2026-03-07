import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CoverImageUpload } from "./CoverImageUpload";
import { TagSelector } from "./TagSelector";
import { DollarSign } from "lucide-react";

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

  const price = parseFloat(data.priceEstimate) || 0;
  const earnings = (price * 0.8).toFixed(2);

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
          <Input
            placeholder="Tokyo, Japan"
            value={data.destination}
            onChange={(e) => update("destination", e.target.value)}
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

        <div className="space-y-2">
          <Label>Price ($)</Label>
          <Input
            type="number"
            min="0"
            placeholder="1500"
            value={data.priceEstimate}
            onChange={(e) => update("priceEstimate", e.target.value)}
          />
          {price > 0 && (
            <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 mt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                <DollarSign className="h-4 w-4" />
                <span>💰 You earn ${earnings}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Traviso takes 20% platform fee</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagSelector selected={data.tags} onChange={(tags) => update("tags", tags)} />
      </div>
    </div>
  );
}
