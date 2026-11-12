import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar";
import { ThemeProvider } from "../context/ThemeContext";

const mockCities = [
  { city: "Tokyo", aqi: 42 },
  { city: "Delhi", aqi: 240 },
  { city: "London", aqi: 55 },
];

function renderWithProviders(ui) {
  return render(
    <ThemeProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ThemeProvider>
  );
}

describe("Navbar Component", () => {
  it("renders brand logo, title, and live global AQI chip correctly", () => {
    renderWithProviders(
      <Navbar globalAqi={88} cities={mockCities} />
    );

    // Checks brand and links
    expect(screen.getByText(/Air/i)).toBeInTheDocument();
    expect(screen.getByText(/Scope/i)).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Rankings")).toBeInTheDocument();

    // Checks global AQI chip
    expect(screen.getByText("88")).toBeInTheDocument();
  });

  it("opens city search dropdown and filters cities on input interaction", () => {
    renderWithProviders(
      <Navbar globalAqi={88} cities={mockCities} />
    );

    // Click search button
    const searchBtn = screen.getByRole("button", { name: /search cities/i });
    fireEvent.click(searchBtn);

    // Expect input to appear
    const input = screen.getByPlaceholderText(/type city name/i);
    expect(input).toBeInTheDocument();

    // Type query
    fireEvent.change(input, { target: { value: "Del" } });
    expect(screen.getByText("Delhi")).toBeInTheDocument();
    expect(screen.queryByText("Tokyo")).not.toBeInTheDocument();
  });

  it("toggles theme when dark mode button is clicked", () => {
    renderWithProviders(
      <Navbar globalAqi={88} cities={mockCities} />
    );

    const toggleBtn = screen.getByRole("button", { name: /switch to/i });
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
  });
});
