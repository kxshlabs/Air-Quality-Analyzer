import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import CityDetail from "./CityDetail";

vi.mock("axios");

const mockCityData = {
  city: "Tokyo",
  country: "Japan",
  aqi: 45,
  pm25: 12,
  pm10: 22,
  o3: 18,
  so2: 4,
  no2: 8,
  co: 1.2,
  temperature: 20,
  humidity: 55,
  wind_speed: 2.5,
  pressure: 1013,
  uvi: 3,
};

const mockNullCityData = {
  city: "UnknownCity",
  country: null,
  aqi: null,
  pm25: null,
  pm10: null,
  o3: null,
  so2: null,
  no2: null,
  co: null,
  temperature: null,
  humidity: null,
  wind_speed: null,
  pressure: null,
  uvi: null,
};

function renderCityDetail(cityName = "Tokyo") {
  return render(
    <MemoryRouter initialEntries={[`/city/${cityName}`]}>
      <Routes>
        <Route path="/city/:name" element={<CityDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CityDetail Page Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders city details, hero section, advisory, and pollutant grid", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/history")) {
        return Promise.resolve({ data: [{ date: "2026-11-14", aqi: 45 }] });
      }
      if (url.includes("/forecast")) {
        return Promise.resolve({
          data: [{ date: "2026-11-15", pm25_avg: 14, o3_avg: 19, uvi: 3 }],
        });
      }
      return Promise.resolve({ data: mockCityData });
    });

    renderCityDetail("Tokyo");

    await waitFor(() => {
      expect(screen.getByText("Tokyo")).toBeInTheDocument();
      expect(screen.getByText(/Air quality is good\. Enjoy outdoor activities\./i)).toBeInTheDocument();
      expect(screen.getByText("Your Personal Risk")).toBeInTheDocument();
      expect(screen.getByText("Live Pollutant Concentrations")).toBeInTheDocument();
    });
  });

  it("handles empty/null data gracefully without crashing", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/history")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/forecast")) {
        return Promise.resolve({ data: null });
      }
      return Promise.resolve({ data: mockNullCityData });
    });

    renderCityDetail("UnknownCity");

    await waitFor(() => {
      expect(screen.getByText("UnknownCity")).toBeInTheDocument();
      expect(screen.getByText("Historical trend accumulates over time")).toBeInTheDocument();
      expect(screen.getByText("Forecast unavailable for this station")).toBeInTheDocument();
    });
  });
});
