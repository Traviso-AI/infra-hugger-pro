import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StepProgressBar } from "@/components/creator-studio/StepProgressBar";
import { StepTripBasics, TripBasicsData, TripBasicsErrors } from "@/components/creator-studio/StepTripBasics";
import { StepBuildItinerary, DayForm, ItineraryErrors } from "@/components/creator-studio/StepBuildItinerary";
import { StepPreviewPublish, validatePublishReady } from "@/components/creator-studio/StepPreviewPublish";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";

function toTitleCase(str: string): string {
  const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it"]);
  return str.replace(/\w\S*/g, (word, index) => {
    if (index !== 0 && minor.has(word.toLowerCase())) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
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
    if (!hasActivity) dayErrors[dayIdx] = "Each day must have at least 1 activity with a title";
    day.activities.forEach((act, actIdx) => {
      if (act.title.trim() && !act.type) activityErrors[`${dayIdx}-${actIdx}`] = "Activity type is required";
      if (!act.title.trim() && day.activities.length === 1) activityErrors[`${dayIdx}-${actIdx}`] = "Activity title is required";
    });
  });
  return { dayErrors, activityErrors };
}

export default function EditTrip() {
  const { id } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [basicsErrors, setBasicsErrors] = useState<TripBasicsErrors>({});
  const [itineraryErrors, setItineraryErrors] = useState<ItineraryErrors>({ dayErrors: {}, activityErrors: {} });

  const [basics, setBasics] = useState<TripBasicsData>({
    title: "", destination: "", description: "", durationDays: "3",
    priceEstimate: "", tags: [], coverImageUrl: null,
  });
  const [days, setDays] = useState<DayForm[]>([]);

  const { data: tripData, isLoading: tripLoading } = useQuery({
    queryKey: ["edit-trip", id],
    queryFn: async () => {
      const { data: trip } = await supabase.from("trips").select("*").eq("id", id!).single();
      const { data: tripDays } = await supabase
        .from("trip_days")
        .select("*, trip_activities(*)")
        .eq("trip_id", id!)
        .order("day_number");
      return { trip, days: tripDays || [] };
    },
    enabled: !!id,
  });

  // Populate form from loaded data
  useEffect(() => {
    if (tripData?.trip && !initialized) {
      const t = tripData.trip;
      setBasics({
        title: t.title,
        destination: t.destination,
        description: t.description || "",
        durationDays: String(t.duration_days),
        priceEstimate: t.price_estimate ? String(t.price_estimate) : "",
        tags: t.tags || [],
        coverImageUrl: t.cover_image_url,
      });
      setDays(
        tripData.days.map((d: any) => ({
          title: d.title || "",
          description: d.description || "",
          activities: d.trip_activities?.length > 0
            ? d.trip_activities
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((a: any) => ({
                  type: a.type,
                  title: a.title,
                  description: a.description || "",
                  location: a.location || "",
                }))
            : [{ type: "activity", title: "", description: "", location: "" }],
        }))
      );
      setInitialized(true);
    }
  }, [tripData, initialized]);

  const handleBasicsChange = (data: TripBasicsData) => {
    setBasics(data);
    if (Object.keys(basicsErrors).length > 0) setBasicsErrors(validateBasics(data));
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
      if (Object.keys(errors).length > 0) { toast.error("Please fix the errors before continuing"); return; }
      const numDays = parseInt(basics.durationDays) || 1;
      if (days.length < numDays) {
        const newDays = [...days];
        while (newDays.length < numDays) newDays.push({ title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "" }] });
        setDays(newDays);
      }
    }
    if (step === 2) {
      const errors = validateItinerary(days);
      setItineraryErrors(errors);
      if (Object.keys(errors.dayErrors).length > 0 || Object.keys(errors.activityErrors).length > 0) { toast.error("Each day needs at least 1 activity with a title"); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => { setStep((s) => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const { ready: publishReady } = validatePublishReady(basics, days);

  const handleSave = async (publish: boolean) => {
    if (!user || !id) return;
    if (publish) {
      const bErrors = validateBasics(basics);
      setBasicsErrors(bErrors);
      const iErrors = validateItinerary(days);
      setItineraryErrors(iErrors);
      if (Object.keys(bErrors).length > 0 || Object.keys(iErrors.dayErrors).length > 0 || Object.keys(iErrors.activityErrors).length > 0) {
        toast.error("Please fix all errors before publishing"); return;
      }
    }

    setLoading(true);
    try {
      // Update trip
      const { error: tripError } = await supabase.from("trips").update({
        title: toTitleCase(basics.title),
        description: basics.description,
        destination: basics.destination,
        duration_days: days.length,
        price_estimate: basics.priceEstimate ? parseFloat(basics.priceEstimate) : null,
        tags: basics.tags,
        is_published: publish,
        cover_image_url: basics.coverImageUrl,
      }).eq("id", id);
      if (tripError) throw tripError;

      // Delete existing days & activities, re-create
      const { data: existingDays } = await supabase.from("trip_days").select("id").eq("trip_id", id);
      if (existingDays && existingDays.length > 0) {
        const dayIds = existingDays.map((d) => d.id);
        await supabase.from("trip_activities").delete().in("trip_day_id", dayIds);
        await supabase.from("trip_days").delete().eq("trip_id", id);
      }

      // Re-create days and activities
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const { data: tripDay, error: dayError } = await supabase.from("trip_days").insert({
          trip_id: id,
          day_number: i + 1,
          title: day.title || `Day ${i + 1}`,
          description: day.description,
        }).select().single();
        if (dayError) throw dayError;

        const activities = day.activities.filter((a) => a.title).map((a, idx) => ({
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

      toast.success(publish ? "Trip updated & published!" : "Trip saved!");
      navigate(`/trip/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || tripLoading || !initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (tripData?.trip?.creator_id !== user?.id) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-display text-2xl font-bold">You don't have permission to edit this trip.</h1>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold">Edit Trip</h1>
        <p className="text-muted-foreground mt-1">Update your trip details and itinerary.</p>
      </div>

      <div className="mb-8"><StepProgressBar currentStep={step} /></div>

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
          <StepBuildItinerary days={days} onChange={handleDaysChange} destination={basics.destination} durationDays={basics.durationDays} errors={itineraryErrors} />
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={goNext}>Next: Preview <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <StepPreviewPublish basics={basics} days={days} />
          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={loading}>
                <Save className="mr-1 h-4 w-4" /> Save Draft
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSave(true)} disabled={loading || !publishReady}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving...</> : "Save & Publish"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
