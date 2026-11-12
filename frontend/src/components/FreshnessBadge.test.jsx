import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FreshnessBadge from "./FreshnessBadge";

describe("FreshnessBadge Component", () => {
  it("renders live freshness badge with expected class", () => {
    render(<FreshnessBadge freshness="Live" />);
    const badge = screen.getByText("Live");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("badge-live");
  });

  it("falls back to Unknown when freshness prop is null or undefined", () => {
    render(<FreshnessBadge freshness={null} />);
    const badge = screen.getByText("Unknown");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("badge-stale");
  });
});
