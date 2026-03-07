import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DestinationAutocomplete } from "./DestinationAutocomplete";

export interface ActivityForm {
  type: string;
  title: string;
  description: string;
  location: string;
}

export interface DayForm {
  title: string;
  description: string;
  activities: ActivityForm[];
}

interface StepBuildItineraryProps {
  days: DayForm[];
  onChange: (days: DayForm[]) => void;
  destination: string;
  durationDays: string;
}

const emptyActivity = (): ActivityForm => ({
  type: "activity", title: "", description: "", location: "",
});

const ACTIVITY_TYPES = ["activity", "restaurant", "hotel", "flight", "experience", "transport"];

export function StepBuildItinerary({ days, onChange, destination, durationDays }: StepBuildItineraryProps) {
  const [generating, setGenerating] = useState(false);

  const addDay = () => onChange([...days, { title: "", description: "", activities: [emptyActivity()] }]);
  const removeDay = (idx: number) => onChange(days.filter((_, i) => i !== idx));

  const addActivity = (dayIdx: number) => {
    const updated = [...days];
    updated[dayIdx].activities.push(emptyActivity());
    onChange(updated);
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const updated = [...days];
    updated[dayIdx].activities = updated[dayIdx].activities.filter((_, i) => i !== actIdx);
    onChange(updated);
  };

  const updateDay = (dayIdx: number, field: keyof DayForm, value: string) => {
    const updated = [...days];
    (updated[dayIdx] as any)[field] = value;
    onChange(updated);
  };

  const updateActivity = (dayIdx: number, actIdx: number, field: keyof ActivityForm, value: string) => {
    const updated = [...days];
    (updated[dayIdx].activities[actIdx] as any)[field] = value;
    onChange(updated);
  };

  const generateWithAI = async () => {
    if (!destination) {
      toast.error("Please enter a destination in Step 1 first");
      return;
    }
    setGenerating(true);
    try {
      const numDays = parseInt(durationDays) || 3;
      const prompt = `Create a ${numDays} day itinerary for ${destination}. Return a day-by-day breakdown with activities, restaurants, and experiences for each day.

IMPORTANT: You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no code fences. Use this exact structure:
{"days":[{"title":"Day 1: Arrival","description":"Brief overview","activities":[{"type":"activity","title":"Visit Temple","location":"Asakusa, Tokyo","description":"Historic temple"}]}]}

Valid types: activity, restaurant, hotel, flight, experience, transport. Include 3-5 activities per day.`;

      const resp = await supabase.functions.invoke("ai-travel-planner", {
        body: { messages: [{ role: "user", content: prompt }] },
      });

      if (resp.error) throw resp.error;

      // Collect full text from SSE stream or direct response
      let fullText = "";
      if (typeof resp.data === "string") {
        const lines = resp.data.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed.slice(6).trim() !== "[DONE]") {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch {}
          }
        }
      } else if (resp.data && typeof resp.data === "object") {
        // Check if it's an error response
        if (resp.data.error) throw new Error(resp.data.error);
        fullText = JSON.stringify(resp.data);
      }

      console.log("AI raw response length:", fullText.length);

      // Strip markdown code fences if present
      fullText = fullText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Extract JSON object
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not find JSON in response:", fullText.substring(0, 500));
        throw new Error("Could not parse AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const aiDays: DayForm[] = (parsed.days || []).map((d: any) => ({
        title: d.title || "",
        description: d.description || "",
        activities: (d.activities || []).map((a: any) => ({
          type: ACTIVITY_TYPES.includes(a.type) ? a.type : "activity",
          title: a.title || "",
          description: a.description || "",
          location: a.location || "",
        })),
      }));

      if (aiDays.length > 0) {
        onChange(aiDays);
        toast.success(`Generated ${aiDays.length}-day itinerary!`);
      } else {
        throw new Error("No days generated");
      }
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Failed to generate itinerary. Try again or build manually.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Button
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base py-6"
        onClick={generateWithAI}
        disabled={generating}
      >
        {generating ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating itinerary...</>
        ) : (
          <><Sparkles className="mr-2 h-5 w-5" /> Generate itinerary with AI</>
        )}
      </Button>

      {days.map((day, dayIdx) => (
        <Card key={dayIdx} className="overflow-hidden">
          <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b">
            <span className="font-display text-sm font-semibold">Day {dayIdx + 1}</span>
            {days.length > 1 && (
              <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removeDay(dayIdx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Day Title</Label>
                <Input
                  placeholder="e.g. Morning in Shibuya"
                  value={day.title}
                  onChange={(e) => updateDay(dayIdx, "title", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="e.g. Explore the city center"
                  value={day.description}
                  onChange={(e) => updateDay(dayIdx, "description", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              {day.activities.map((act, actIdx) => (
                <div key={actIdx} className="rounded-lg border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Activity {actIdx + 1}</Badge>
                    {day.activities.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeActivity(dayIdx, actIdx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={act.type} onValueChange={(v) => updateActivity(dayIdx, actIdx, "type", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input placeholder="e.g. Visit Senso-ji Temple" value={act.title} onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Location</Label>
                    <DestinationAutocomplete
                      value={act.location}
                      onChange={(v) => updateActivity(dayIdx, actIdx, "location", v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input placeholder="e.g. Iconic Buddhist temple in Asakusa" value={act.description} onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="text-xs text-accent" onClick={() => addActivity(dayIdx)}>
                <Plus className="mr-1 h-3 w-3" /> Add Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addDay} className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Day
      </Button>
    </div>
  );
}
