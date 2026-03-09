import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TripReviews } from "@/components/trips/TripReviews";

// Mock ReviewForm since it depends on Supabase
vi.mock("@/components/trips/ReviewForm", () => ({
  ReviewForm: () => <div data-testid="review-form">Review Form</div>,
}));

const mockReviews = [
  {
    id: "r1",
    user_id: "user-2",
    rating: 5,
    comment: "Amazing trip!",
    profiles: { display_name: "Jane" },
  },
  {
    id: "r2",
    user_id: "user-3",
    rating: 4,
    comment: null,
    profiles: { display_name: "Bob" },
  },
];

describe("TripReviews", () => {
  it("renders reviews from other users", () => {
    render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId="user-1" reviews={mockReviews} />
      </BrowserRouter>
    );
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Amazing trip!")).toBeInTheDocument();
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows review form for non-creators", () => {
    render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId="user-1" reviews={[]} />
      </BrowserRouter>
    );
    expect(screen.getByTestId("review-form")).toBeInTheDocument();
  });

  it("hides review form for trip creator", () => {
    render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="user-1" userId="user-1" reviews={[]} />
      </BrowserRouter>
    );
    expect(screen.queryByTestId("review-form")).not.toBeInTheDocument();
  });

  it("shows empty state for unauthenticated users", () => {
    render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId={undefined} reviews={[]} />
      </BrowserRouter>
    );
    expect(screen.getByText(/No reviews yet/)).toBeInTheDocument();
  });
});
