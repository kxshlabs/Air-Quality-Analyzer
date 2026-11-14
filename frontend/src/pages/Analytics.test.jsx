import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import Analytics from "./Analytics";

vi.mock("axios");

const mockCities = [
  { city: "Tokyo", aqi: 42, pm25: 12, pm10: 20, o3: 15, so2: 5, no2: 8, co: 2, dominant_pollutant: "pm25" },
  { city: "Delhi", aqi: 240, pm25: 180, pm10: 220, o3: 30, so2: 12, no2: 45, co: 10, dominant_pollutant: "pm25" },
];

const mockRegionsSummary = [
  { region: "Asia", avg_aqi: 141, city_count: 2 },
  { region: "Europe", avg_aqi: 55, city_count: 5 },
];

describe("Analytics Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton on load", () => {
    // Return unresolved promise to test loading state
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(<Analytics />);
    expect(screen.getByTestId("analytics-skeleton")).toBeInTheDocument();
  });

  it("renders without crash", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/aqi/regions/summary")) {
        return Promise.resolve({ data: mockRegionsSummary });
      }
      if (url.includes("/history")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/forecast")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/api/aqi/")) {
        return Promise.resolve({ data: mockCities[0] });
      }
      return Promise.resolve({ data: { data: mockCities } });
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText(/Atmospheric Analytics/i)).toBeInTheDocument();
    });
  });

  it("shows empty-history message when history is empty", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/aqi/regions/summary")) {
        return Promise.resolve({ data: mockRegionsSummary });
      }
      if (url.includes("/history")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/forecast")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/api/aqi/")) {
        return Promise.resolve({ data: mockCities[0] });
      }
      return Promise.resolve({ data: { data: mockCities } });
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(
        screen.getByText("Historical data accumulates with each pipeline run — check back soon")
      ).toBeInTheDocument();
    });
  });
});
