/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg:     "#06060f",
          "bg-end": "#0d0520",
          card:   "rgba(255,255,255,0.03)",
          border: "rgba(255,255,255,0.08)",
          text:   "#f1f5f9",
          muted:  "#94a3b8",
        },
        light: {
          bg:     "#f5f5f4",
          card:   "#ffffff",
          border: "#e7e5e4",
          text:   "#1c1917",
          muted:  "#78716c",
        },
        accent: {
          DEFAULT: "#38bdf8",
          hover:   "#0ea5e9",
          soft:    "rgba(56,189,248,0.12)",
        },
        aqi: {
          good:          "#22c55e",
          moderate:      "#eab308",
          usg:           "#f97316",
          unhealthy:     "#ef4444",
          veryUnhealthy: "#a855f7",
          hazardous:     "#7f1d1d",
          unknown:       "#64748b",
        },
      },
      fontFamily: {
        heading: ['"DM Sans"', "system-ui", "sans-serif"],
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "monospace"],
      },
      animation: {
        "breathing-pulse": "breathing-pulse 4s ease-in-out infinite",
        "orb-glow":        "orb-glow 2s ease-in-out infinite",
        "fade-in-up":      "fade-in-up 0.5s ease-out forwards",
        "slide-in-left":   "slide-in-left 0.4s ease-out forwards",
      },
      keyframes: {
        "breathing-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":      { opacity: "0.7", transform: "scale(1.02)" },
        },
        "orb-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1",   transform: "scale(1.3)" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
