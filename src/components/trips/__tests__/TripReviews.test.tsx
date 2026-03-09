import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TripReviews } from "@/components/trips/TripReviews";

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
    const { getByText } = render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId="user-1" reviews={mockReviews} />
      </BrowserRouter>
    );
    expect(getByText("Reviews")).toBeInTheDocument();
    expect(getByText("Amazing trip!")).toBeInTheDocument();
    expect(getByText("Jane")).toBeInTheDocument();
    expect(getByText("Bob")).toBeInTheDocument();
  });

  it("shows review form for non-creators", () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId="user-1" reviews={[]} />
      </BrowserRouter>
    );
    expect(getByTestId("review-form")).toBeInTheDocument();
  });

  it("hides review form for trip creator", () => {
    const { queryByTestId } = render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="user-1" userId="user-1" reviews={[]} />
      </BrowserRouter>
    );
    expect(queryByTestId("review-form")).not.toBeInTheDocument();
  });

  it("shows empty state for unauthenticated users", () => {
    const { getByText } = render(
      <BrowserRouter>
        <TripReviews tripId="trip-1" creatorId="creator-1" userId={undefined} reviews={[]} />
      </BrowserRouter>
    );
    expect(getByText(/No reviews yet/)).toBeInTheDocument();
  });
});
