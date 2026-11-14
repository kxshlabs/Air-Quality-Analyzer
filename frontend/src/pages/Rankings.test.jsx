import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Rankings from "./Rankings";

vi.mock("axios");

const mockRankingsData = [
  {
    city: "Tokyo",
    country: "Japan",
    region: "Asia",
    aqi: 28,
    pm25: 14,
    dominant_pollutant: "o3",
    data_quality: "good",
  },
  {
    city: "Paris",
    country: "France",
    region: "Europe",
    aqi: 65,
    pm25: 24,
    dominant_pollutant: "pm25",
    data_quality: "partial",
  },
];

const mockEmptyRankingsData = [];

function renderRankings() {
  return render(
    <BrowserRouter>
      <Rankings />
    </BrowserRouter>
  );
}

describe("Rankings Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rankings table headers, region controls, and city rows", async () => {
    axios.get.mockResolvedValueOnce({
      data: { rankings: mockRankingsData },
    });

    renderRankings();

    await waitFor(() => {
      expect(screen.getByText(/Global Air Quality Rankings/i)).toBeInTheDocument();
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Paris")).toBeInTheDocument();
      expect(screen.getByText("Asia")).toBeInTheDocument();
      expect(screen.getByText("Europe")).toBeInTheDocument();
    });
  });

  it("handles empty or null data gracefully without crashing", async () => {
    axios.get.mockResolvedValueOnce({
      data: { rankings: mockEmptyRankingsData },
    });

    renderRankings();

    await waitFor(() => {
      expect(screen.getByText(/Global Air Quality Rankings/i)).toBeInTheDocument();
      expect(
        screen.getByText("No cities matching the selected criteria.")
      ).toBeInTheDocument();
    });
  });
});
