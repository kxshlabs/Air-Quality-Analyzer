import { describe, it, expect } from "vitest";
import {
  getAQIColor,
  getAQILabel,
  getAQIBand,
  formatAQI,
  getCityRegion,
  getBreathingSpeed,
  getBreathingTint,
} from "./aqiHelpers";

describe("aqiHelpers utility functions", () => {
  it("maps 6 AQI severity color bands accurately", () => {
    expect(getAQIColor(30)).toBe("#22c55e"); // Good
    expect(getAQIColor(75)).toBe("#eab308"); // Moderate
    expect(getAQIColor(120)).toBe("#f97316"); // USG
    expect(getAQIColor(180)).toBe("#ef4444"); // Unhealthy
    expect(getAQIColor(240)).toBe("#a855f7"); // Very Unhealthy
    expect(getAQIColor(350)).toBe("#7f1d1d"); // Hazardous
    expect(getAQIColor(null)).toBe("#64748b"); // Unknown
  });

  it("returns correct labels and bands for all ranges", () => {
    expect(getAQILabel(40)).toBe("Good");
    expect(getAQILabel(80)).toBe("Moderate");
    expect(getAQILabel(130)).toBe("Unhealthy (Sensitive)");
    expect(getAQILabel(170)).toBe("Unhealthy");
    expect(getAQILabel(250)).toBe("Very Unhealthy");
    expect(getAQILabel(320)).toBe("Hazardous");

    expect(getAQIBand(40)).toBe("good");
    expect(getAQIBand(320)).toBe("hazardous");
  });

  it("formats AQI values correctly", () => {
    expect(formatAQI(42.4)).toBe("42");
    expect(formatAQI(null)).toBe("—");
    expect(formatAQI(undefined)).toBe("—");
  });

  it("resolves continental regions for major global cities", () => {
    expect(getCityRegion("Tokyo")).toBe("Asia");
    expect(getCityRegion("London")).toBe("Europe");
    expect(getCityRegion("New York")).toBe("Americas");
    expect(getCityRegion("Cairo")).toBe("Africa");
    expect(getCityRegion("Sydney")).toBe("Oceania");
    expect(getCityRegion("Atlantis")).toBe("Other");
  });

  it("calculates breathing speed and tint based on AQI severity", () => {
    expect(getBreathingSpeed(30)).toBe("6s");
    expect(getBreathingSpeed(350)).toBe("2s");
    expect(getBreathingTint(30)).toContain("34,197,94");
    expect(getBreathingTint(350)).toContain("127,29,29");
  });
});
