import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActivityForm {
  type: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  priceEstimate: string;
}

interface DayForm {
  title: string;
  description: string;
  activities: ActivityForm[];
}

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");
  const [tags, setTags] = useState("");
  const [days, setDays] = useState<DayForm[]>([
    { title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "", startTime: "", priceEstimate: "" }] }
  ]);

  const addDay = () => {
    setDays([...days, { title: "", description: "", activities: [{ type: "activity", title: "", description: "", location: "", startTime: "", priceEstimate: "" }] }]);
  };

  const removeDay = (idx: number) => {
    setDays(days.filter((_, i) => i !== idx));
  };

  const addActivity = (dayIdx: number) => {
    const updated = [...days];
    updated[dayIdx].activities.push({ type: "activity", title: "", description: "", location: "", startTime: "", priceEstimate: "" });
    setDays(updated);
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const updated = [...days];
    updated[dayIdx].activities = updated[dayIdx].activities.filter((_, i) => i !== actIdx);
    setDays(updated);
  };

  const updateDay = (dayIdx: number, field: keyof DayForm, value: string) => {
    const updated = [...days];
    (updated[dayIdx] as any)[field] = value;
    setDays(updated);
  };

  const updateActivity = (dayIdx: number, actIdx: number, field: keyof ActivityForm, value: string) => {
    const updated = [...days];
    (updated[dayIdx].activities[actIdx] as any)[field] = value;
    setDays(updated);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!user) return;
    if (!title || !destination) {
      toast.error("Title and destination are required");
      return;
    }

    setLoading(true);
    try {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({
          creator_id: user.id,
          title,
          description,
          destination,
          duration_days: days.length,
          price_estimate: priceEstimate ? parseFloat(priceEstimate) : null,
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
          is_published: publish,
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
            start_time: a.startTime || null,
            price_estimate: a.priceEstimate ? parseFloat(a.priceEstimate) : null,
            sort_order: idx,
          }));

        if (activities.length > 0) {
          const { error: actError } = await supabase.from("trip_activities").insert(activities);
          if (actError) throw actError;
        }
      }

      toast.success(publish ? "Trip published!" : "Trip saved as draft!");
      navigate(`/trip/${trip.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-2">Create a Trip</h1>
      <p className="text-muted-foreground mb-8">Design an itinerary and share it with the world</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input placeholder="3 Days in Tokyo" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input placeholder="Tokyo, Japan" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe your trip..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Estimate ($)</Label>
                <Input type="number" placeholder="1500" value={priceEstimate} onChange={(e) => setPriceEstimate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="food, nightlife, culture" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {days.map((day, dayIdx) => (
          <Card key={dayIdx}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Day {dayIdx + 1}</CardTitle>
                {days.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeDay(dayIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day Title</Label>
                  <Input placeholder="Arrival & Exploration" value={day.title} onChange={(e) => updateDay(dayIdx, "title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Brief description" value={day.description} onChange={(e) => updateDay(dayIdx, "description", e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Activities</Label>
                {day.activities.map((act, actIdx) => (
                  <div key={actIdx} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Activity {actIdx + 1}</Badge>
                      {day.activities.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeActivity(dayIdx, actIdx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={act.type} onValueChange={(v) => updateActivity(dayIdx, actIdx, "type", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["flight", "hotel", "restaurant", "activity", "event", "transport"].map((t) => (
                              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Title</Label>
                        <Input placeholder="Visit Senso-ji" value={act.title} onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Location</Label>
                        <Input placeholder="Asakusa, Tokyo" value={act.location} onChange={(e) => updateActivity(dayIdx, actIdx, "location", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price ($)</Label>
                        <Input type="number" placeholder="0" value={act.priceEstimate} onChange={(e) => updateActivity(dayIdx, actIdx, "priceEstimate", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input placeholder="Brief description" value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addActivity(dayIdx)}>
                  <Plus className="mr-1 h-3 w-3" /> Add Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addDay} className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Day
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => handleSubmit(false)} disabled={loading}>
            Save Draft
          </Button>
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleSubmit(true)} disabled={loading}>
            {loading ? "Publishing..." : "Publish Trip"}
          </Button>
        </div>
      </div>
    </div>
  );
}
