/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep Violet dark theme
        dark: {
          bg:      "#0d0a1a",
          card:    "#13102a",
          border:  "#2d2050",
          text:    "#f1f5f9",
          muted:   "#94a3b8",
        },
        // Stone light theme
        light: {
          bg:      "#f5f5f4",
          card:    "#ffffff",
          border:  "#e7e5e4",
          text:    "#1c1917",
          muted:   "#78716c",
        },
        // Shared accent — violet
        accent: {
          DEFAULT: "#a78bfa",
          hover:   "#8b5cf6",
          soft:    "#2d2050",
        },
        // AQI status colors — semantic, same in both modes
        aqi: {
          good:      "#22c55e",
          moderate:  "#eab308",
          poor:      "#f97316",
          veryPoor:  "#ef4444",
          severe:    "#9333ea",
          unknown:   "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
