import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TripItinerary } from "@/components/trips/TripItinerary";

const mockDays = [
  {
    id: "day-1",
    day_number: 1,
    title: "Arrival Day",
    description: "Getting settled in",
    trip_activities: [
      {
        id: "act-1",
        title: "Check into hotel",
        type: "hotel",
        description: "Luxury resort",
        location: "Downtown",
        start_time: "14:00",
        price_estimate: 200,
        sort_order: 0,
      },
      {
        id: "act-2",
        title: "Welcome dinner",
        type: "restaurant",
        description: null,
        location: "Seaside Grill",
        start_time: "19:00",
        price_estimate: 50,
        sort_order: 1,
      },
    ],
  },
  {
    id: "day-2",
    day_number: 2,
    title: null,
    description: null,
    trip_activities: [],
  },
];

describe("TripItinerary", () => {
  it("renders day headers and activities", () => {
    render(
      <BrowserRouter>
        <TripItinerary days={mockDays} canVote={false} />
      </BrowserRouter>
    );
    expect(screen.getByText("Itinerary")).toBeInTheDocument();
    expect(screen.getByText(/Arrival Day/)).toBeInTheDocument();
    expect(screen.getByText("Check into hotel")).toBeInTheDocument();
    expect(screen.getByText("Welcome dinner")).toBeInTheDocument();
    expect(screen.getByText("$200")).toBeInTheDocument();
  });

  it("shows empty state for days with no activities", () => {
    render(
      <BrowserRouter>
        <TripItinerary days={mockDays} canVote={false} />
      </BrowserRouter>
    );
    expect(screen.getByText("No activities planned yet")).toBeInTheDocument();
  });

  it("returns null when days array is empty", () => {
    const { container } = render(
      <BrowserRouter>
        <TripItinerary days={[]} canVote={false} />
      </BrowserRouter>
    );
    expect(container.innerHTML).toBe("");
  });
});
