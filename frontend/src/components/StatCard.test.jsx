import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "./StatCard";

describe("StatCard Component", () => {
  it("renders label, value, and subtitle correctly", () => {
    render(
      <StatCard
        label="Cleanest City"
        value="Helsinki"
        sub="AQI 15 · Excellent"
      />
    );

    expect(screen.getByText("Cleanest City")).toBeInTheDocument();
    expect(screen.getByText("Helsinki")).toBeInTheDocument();
    expect(screen.getByText("AQI 15 · Excellent")).toBeInTheDocument();
  });

  it("renders without subtitle when optional sub prop is omitted", () => {
    render(<StatCard label="Global Avg" value="78" />);

    expect(screen.getByText("Global Avg")).toBeInTheDocument();
    expect(screen.getByText("78")).toBeInTheDocument();
  });
});
