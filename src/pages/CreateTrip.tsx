import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProgressBar } from "@/components/creator-studio/StepProgressBar";
import { StepTripBasics, TripBasicsData, TripBasicsErrors } from "@/components/creator-studio/StepTripBasics";
import { StepBuildItinerary, DayForm, ItineraryErrors } from "@/components/creator-studio/StepBuildItinerary";
import { StepPreviewPublish, validatePublishReady } from "@/components/creator-studio/StepPreviewPublish";
import { SuccessScreen } from "@/components/creator-studio/SuccessScreen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";

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

function validateBasics(basics: TripBasicsData): TripBasicsErrors {
  const errors: TripBasicsErrors = {};
  if (basics.title.trim().length < 3) errors.title = "Title must be at least 3 characters";
  if (!basics.destination.trim()) errors.destination = "Please select a destination";
  if (basics.description.trim().length < 20) errors.description = `Description must be at least 20 characters (${basics.description.trim().length} now)`;
  const dur = parseInt(basics.durationDays) || 0;
  if (dur < 1 || dur > 30) errors.durationDays = "Duration must be between 1 and 30 days";
  if (basics.tags.length < 1) errors.tags = "Select at least 1 tag";
  return errors;
}

function validateItinerary(days: DayForm[]): ItineraryErrors {
  const dayErrors: Record<number, string> = {};
  const activityErrors: Record<string, string> = {};

  days.forEach((day, dayIdx) => {
    const hasActivity = day.activities.some((a) => a.title.trim());
    if (!hasActivity) {
      dayErrors[dayIdx] = "Each day must have at least 1 activity with a title";
    }
    day.activities.forEach((act, actIdx) => {
      if (act.title.trim() && !act.type) {
        activityErrors[`${dayIdx}-${actIdx}`] = "Activity type is required";
      }
      if (!act.title.trim() && day.activities.length === 1) {
        activityErrors[`${dayIdx}-${actIdx}`] = "Activity title is required";
      }
    });
  });

  return { dayErrors, activityErrors };
}

export default function CreateTrip() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishedTripId, setPublishedTripId] = useState<string | null>(null);
  const [basicsErrors, setBasicsErrors] = useState<TripBasicsErrors>({});
  const [itineraryErrors, setItineraryErrors] = useState<ItineraryErrors>({ dayErrors: {}, activityErrors: {} });

  const [basics, setBasics] = useState<TripBasicsData>({
    title: "", destination: "", description: "", durationDays: "3",
    priceEstimate: "", tags: [], coverImageUrl: null,
  });

  const [days, setDays] = useState<DayForm[]>([
    { title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "" }] },
  ]);

  const handleBasicsChange = (data: TripBasicsData) => {
    setBasics(data);
    // Clear errors for fields as they're updated
    if (Object.keys(basicsErrors).length > 0) {
      setBasicsErrors(validateBasics(data));
    }
  };

  const handleDaysChange = (newDays: DayForm[]) => {
    setDays(newDays);
    if (Object.keys(itineraryErrors.dayErrors).length > 0 || Object.keys(itineraryErrors.activityErrors).length > 0) {
      setItineraryErrors(validateItinerary(newDays));
    }
  };

  const goNext = () => {
    if (step === 1) {
      const errors = validateBasics(basics);
      setBasicsErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the errors before continuing");
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
    if (step === 2) {
      const errors = validateItinerary(days);
      setItineraryErrors(errors);
      if (Object.keys(errors.dayErrors).length > 0 || Object.keys(errors.activityErrors).length > 0) {
        toast.error("Each day needs at least 1 activity with a title");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { ready: publishReady } = validatePublishReady(basics, days);

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;

    if (publish) {
      // Check creator mode
      if (!profile?.is_creator) {
        toast.error("Enable Creator Mode in your profile to publish trips and start earning.", {
          action: {
            label: "Go to Profile",
            onClick: () => navigate(`/profile/${profile?.username || user?.id}`),
          },
        });
        return;
      }
      // Re-validate everything
      const bErrors = validateBasics(basics);
      setBasicsErrors(bErrors);
      const iErrors = validateItinerary(days);
      setItineraryErrors(iErrors);
      if (Object.keys(bErrors).length > 0 || Object.keys(iErrors.dayErrors).length > 0 || Object.keys(iErrors.activityErrors).length > 0) {
        toast.error("Please fix all errors before publishing");
        return;
      }
    } else {
      if (!basics.title || !basics.destination) {
        toast.error("Title and destination are required to save");
        return;
      }
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

  if (publishedTripId) {
    return (
      <div className="container max-w-3xl py-8 md:py-12 pb-24">
        <SuccessScreen tripId={publishedTripId} basics={basics} />
      </div>
    );
  }

  // Gate: require Creator Mode before entering the studio
  if (!profile?.is_creator) {
    return (
      <div className="container max-w-lg py-16 md:py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Save className="h-7 w-7 text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-3">Enable Creator Mode</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Creator Mode lets you build trips, publish them to the marketplace, and earn when others book.
        </p>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90 px-6"
          onClick={async () => {
            if (!user) { navigate("/login"); return; }
            try {
              const { error } = await supabase
                .from("profiles")
                .update({ is_creator: true })
                .eq("user_id", user.id);
              if (error) throw error;
              toast.success("Creator Mode enabled! Welcome to Creator Studio.");
              window.location.reload();
            } catch (err: any) {
              toast.error(err.message || "Failed to enable Creator Mode");
            }
          }}
        >
          Enable Creator Mode
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          You can disable this anytime in your{" "}
          <Link to={`/profile/${profile?.username || user?.id}`} className="text-accent underline">
            profile settings
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold">Creator Studio</h1>
        <p className="text-muted-foreground mt-1">Build a trip. Earn when others book it.</p>
      </div>

      <div className="mb-8">
        <StepProgressBar currentStep={step} />
      </div>

      {step === 1 && (
        <>
          <StepTripBasics data={basics} onChange={handleBasicsChange} errors={basicsErrors} />
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
            onChange={handleDaysChange}
            destination={basics.destination}
            durationDays={basics.durationDays}
            errors={itineraryErrors}
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
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => handleSubmit(true)}
                disabled={loading || !publishReady}
              >
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Trip"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
