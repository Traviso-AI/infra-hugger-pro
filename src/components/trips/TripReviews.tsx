import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ReviewForm } from "@/components/trips/ReviewForm";

interface TripReviewsProps {
  tripId: string;
  creatorId: string;
  userId?: string;
  reviews: any[];
}

export function TripReviews({ tripId, creatorId, userId, reviews }: TripReviewsProps) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-4">Reviews</h2>
      {userId && creatorId !== userId && (
        <div className="mb-4">
          <ReviewForm
            tripId={tripId}
            existingReview={reviews?.find((r: any) => r.user_id === userId) || null}
          />
        </div>
      )}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.filter((r: any) => r.user_id !== userId).map((review: any) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium">
                    {review.profiles?.display_name?.[0] || "U"}
                  </div>
                  <span className="text-sm font-medium">{review.profiles?.display_name || "User"}</span>
                  <div className="flex">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-sunset text-sunset" />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !userId ? (
        <p className="text-sm text-muted-foreground">No reviews yet. Be the first to book and review!</p>
      ) : null}
    </div>
  );
}
