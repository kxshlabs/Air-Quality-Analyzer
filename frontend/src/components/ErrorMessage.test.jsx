import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorMessage from "./ErrorMessage";

describe("ErrorMessage Component", () => {
  it("renders error message text and warning emoji", () => {
    render(<ErrorMessage message="Unable to fetch telemetry data." />);
    expect(screen.getByText("Unable to fetch telemetry data.")).toBeInTheDocument();
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("calls onRetry callback when retry button is clicked", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorMessage
        message="Connection timed out"
        onRetry={handleRetry}
      />
    );

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

