import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AQIRing from "./AQIRing";

describe("AQIRing Component", () => {
  it("renders formatted AQI value and handles null values gracefully", () => {
    const { rerender } = render(<AQIRing aqi={75} size={80} />);
    expect(screen.getByText("75")).toBeInTheDocument();

    rerender(<AQIRing aqi={null} size={80} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("scales up text and renders AQI subtitle badge when size is 120 or larger", () => {
    render(<AQIRing aqi={180} size={130} />);
    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText("AQI")).toBeInTheDocument();
  });
});

