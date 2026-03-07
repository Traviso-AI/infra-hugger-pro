import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProgressBar } from "@/components/creator-studio/StepProgressBar";
import { StepTripBasics, TripBasicsData } from "@/components/creator-studio/StepTripBasics";
import { StepBuildItinerary, DayForm } from "@/components/creator-studio/StepBuildItinerary";
import { StepPreviewPublish } from "@/components/creator-studio/StepPreviewPublish";
import { SuccessScreen } from "@/components/creator-studio/SuccessScreen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";

// Unsplash fallback map (same as extract-trip function)
const unsplashMap: Record<string, string> = {
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  seoul: "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  miami: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
};

function toTitleCase(str: string): string {
  const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it"]);
  return str.replace(/\w\S*/g, (word, index) => {
    if (index !== 0 && minor.has(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function getUnsplashFallback(destination: string): string {
  const lower = destination.toLowerCase();
  const match = Object.entries(unsplashMap).find(([key]) => lower.includes(key));
  return match?.[1] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";
}

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishedTripId, setPublishedTripId] = useState<string | null>(null);

  const [basics, setBasics] = useState<TripBasicsData>({
    title: "", destination: "", description: "", durationDays: "3",
    priceEstimate: "", tags: [], coverImageUrl: null,
  });

  const [days, setDays] = useState<DayForm[]>([
    { title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "" }] },
  ]);

  const goNext = () => {
    if (step === 1) {
      if (!basics.title || !basics.destination) {
        toast.error("Title and destination are required");
        return;
      }
      // Sync days count with duration
      const numDays = parseInt(basics.durationDays) || 1;
      if (days.length < numDays) {
        const newDays = [...days];
        while (newDays.length < numDays) {
          newDays.push({ title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "" }] });
        }
        setDays(newDays);
      }
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;
    if (!basics.title || !basics.destination) {
      toast.error("Title and destination are required");
      return;
    }

    setLoading(true);
    try {
      const coverUrl = basics.coverImageUrl || getUnsplashFallback(basics.destination);

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          creator_id: user.id,
          title: toTitleCase(basics.title),
          description: basics.description,
          destination: basics.destination,
          duration_days: days.length,
          price_estimate: basics.priceEstimate ? parseFloat(basics.priceEstimate) : null,
          tags: basics.tags,
          is_published: publish,
          cover_image_url: coverUrl,
        })
        .select()
        .single();

      if (tripError) throw tripError;

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const { data: tripDay, error: dayError } = await supabase
          .from("trip_days")
          .insert({
            trip_id: trip.id,
            day_number: i + 1,
            title: day.title || `Day ${i + 1}`,
            description: day.description,
          })
          .select()
          .single();

        if (dayError) throw dayError;

        const activities = day.activities
          .filter((a) => a.title)
          .map((a, idx) => ({
            trip_day_id: tripDay.id,
            type: a.type,
            title: a.title,
            description: a.description || null,
            location: a.location || null,
            sort_order: idx,
          }));

        if (activities.length > 0) {
          const { error: actError } = await supabase.from("trip_activities").insert(activities);
          if (actError) throw actError;
        }
      }

      if (publish) {
        setPublishedTripId(trip.id);
        toast.success("Trip published!");
      } else {
        toast.success("Trip saved as draft!");
        navigate(`/trip/${trip.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save trip");
    } finally {
      setLoading(false);
    }
  };

  // Success screen after publishing
  if (publishedTripId) {
    return (
      <div className="container max-w-3xl py-8 md:py-12 pb-24">
        <SuccessScreen tripId={publishedTripId} basics={basics} />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold">Creator Studio</h1>
        <p className="text-muted-foreground mt-1">Build a trip. Earn when others book it.</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <StepProgressBar currentStep={step} />
      </div>

      {/* Steps */}
      {step === 1 && (
        <>
          <StepTripBasics data={basics} onChange={setBasics} />
          <div className="border-t border-border mt-6" />
          <div className="flex items-center justify-between py-8">
            <span className="text-sm text-muted-foreground">Step 1 of 3</span>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-6" onClick={goNext}>
              Next: Build Itinerary <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <StepBuildItinerary
            days={days}
            onChange={setDays}
            destination={basics.destination}
            durationDays={basics.durationDays}
          />
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={goNext}>
              Next: Preview <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <StepPreviewPublish basics={basics} days={days} />
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={goBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSubmit(true)} disabled={loading}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Trip"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
