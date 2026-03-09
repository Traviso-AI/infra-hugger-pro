import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ReviewFormProps {
  tripId: string;
  existingReview?: { id: string; rating: number; comment: string | null } | null;
}

export function ReviewForm({ tripId, existingReview }: ReviewFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from("reviews")
          .update({ rating, comment: comment.trim() || null })
          .eq("id", existingReview.id);
        if (error) throw error;
        toast.success("Review updated!");
      } else {
        const { error } = await supabase.from("reviews").insert({
          trip_id: tripId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        });
        if (error) throw error;
        toast.success("Review submitted!");
      }
      queryClient.invalidateQueries({ queryKey: ["trip-reviews", tripId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <h3 className="font-display text-lg font-semibold">
          {existingReview ? "Update Your Review" : "Leave a Review"}
        </h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoveredRating || rating)
                    ? "fill-sunset text-sunset"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground self-center">
              {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Great" : "Amazing"}
            </span>
          )}
        </div>
        <Textarea
          placeholder="Share your experience... (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{comment.length}/500</span>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
          >
            {loading ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
