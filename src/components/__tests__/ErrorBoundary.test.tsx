import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ThrowingComponent(): JSX.Element {
  throw new Error("Test error");
  return <div>Never renders</div>;
}

function GoodComponent() {
  return <div>Working fine</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(getByText("Working fine")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(getByText("Something went wrong")).toBeInTheDocument();
    expect(getByText("Try Again")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(getByText("Custom fallback")).toBeInTheDocument();
    spy.mockRestore();
  });
});
