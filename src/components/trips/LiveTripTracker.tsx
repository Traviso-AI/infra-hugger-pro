import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, MapPin, Clock, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface LiveTripTrackerProps {
  tripId: string;
  days: any[];
  destination: string;
}

export function LiveTripTracker({ tripId, days, destination }: LiveTripTrackerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  // Check if user has an active booking for this trip
  const { data: activeBooking } = useQuery({
    queryKey: ["active-booking", tripId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("trip_id", tripId)
        .eq("user_id", user!.id)
        .eq("status", "confirmed")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get completed activities from metadata
  const { data: completedActivities = [] } = useQuery({
    queryKey: ["completed-activities", tripId, user?.id],
    queryFn: async () => {
      // Store in trip_activities metadata via a simple local approach
      const stored = localStorage.getItem(`traviso_tracker_${tripId}_${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!user && !!activeBooking,
  });

  if (!activeBooking || !days?.length) return null;

  const allActivities = days.flatMap((day: any) =>
    (day.trip_activities || []).map((a: any) => ({
      ...a,
      day_number: day.day_number,
    }))
  );

  const totalActivities = allActivities.length;
  const completedCount = completedActivities.length;
  const progress = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  const toggleActivity = (activityId: string) => {
    const key = `traviso_tracker_${tripId}_${user?.id}`;
    let updated: string[];
    if (completedActivities.includes(activityId)) {
      updated = completedActivities.filter((id: string) => id !== activityId);
    } else {
      updated = [...completedActivities, activityId];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    queryClient.invalidateQueries({ queryKey: ["completed-activities", tripId, user?.id] });

    if (updated.length === totalActivities && totalActivities > 0) {
      toast.success("🎉 You've completed all activities! What an amazing trip!");
    }
  };

  // Calculate current day based on check-in date
  const checkInDate = activeBooking.check_in ? new Date(activeBooking.check_in) : null;
  const today = new Date();
  const currentDayNumber = checkInDate
    ? Math.max(1, Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  return (
    <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-display text-lg font-bold">Live Trip Tracker</h3>
          </div>
          <Badge className="bg-accent text-accent-foreground text-xs">
            {progress}% complete
          </Badge>
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        <p className="text-xs text-muted-foreground mb-4">
          {completedCount}/{totalActivities} activities completed · Day{" "}
          {Math.min(currentDayNumber, days.length)} of {days.length} in{" "}
          {destination}
        </p>

        <div className="space-y-2">
          {days.map((day: any, idx: number) => {
            const dayActivities = day.trip_activities || [];
            const dayCompleted = dayActivities.filter((a: any) =>
              completedActivities.includes(a.id)
            ).length;
            const isExpanded = expandedDay === idx;
            const isPast = day.day_number < currentDayNumber;
            const isCurrent = day.day_number === currentDayNumber;
            const allDone = dayCompleted === dayActivities.length && dayActivities.length > 0;

            return (
              <div key={day.id} className="rounded-lg border overflow-hidden">
                <button
                  className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                    isCurrent
                      ? "bg-accent/10"
                      : allDone
                      ? "bg-muted/30"
                      : "hover:bg-muted/20"
                  }`}
                  onClick={() => setExpandedDay(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        allDone
                          ? "bg-green-500/20 text-green-600"
                          : isCurrent
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {allDone ? <Check className="h-4 w-4" /> : day.day_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {day.title || `Day ${day.day_number}`}
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px] bg-accent/20 text-accent"
                          >
                            Today
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dayCompleted}/{dayActivities.length} done
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-3 py-2 space-y-1.5">
                        {dayActivities.map((activity: any) => {
                          const isComplete = completedActivities.includes(
                            activity.id
                          );
                          return (
                            <button
                              key={activity.id}
                              className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/30 transition-colors"
                              onClick={() => toggleActivity(activity.id)}
                            >
                              <div
                                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isComplete
                                    ? "bg-green-500 border-green-500"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isComplete && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    isComplete
                                      ? "line-through text-muted-foreground"
                                      : "font-medium"
                                  }`}
                                >
                                  {activity.title}
                                </p>
                                {activity.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {activity.location}
                                  </p>
                                )}
                              </div>
                              {activity.start_time && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {activity.start_time.slice(0, 5)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
