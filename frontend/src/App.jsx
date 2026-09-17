import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { useAQIData } from "./hooks/useAQIData";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Rankings from "./pages/Rankings";
import CityDetail from "./pages/CityDetail";

import Compare from "./pages/Compare";

function AppShell() {
  const { lastUpdated } = useAQIData();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Navbar lastUpdated={lastUpdated} />
      <nav className="border-b border-light-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-1">
          {[
            { to: "/",         label: "🗺️ Map"     },
            { to: "/rankings", label: "🏆 Rankings" },
            { to: "/compare",  label: "⚖️ Compare"  },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "bg-accent/20 text-accent font-medium"
                    : "text-light-muted dark:text-dark-muted hover:text-accent"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/rankings"   element={<Rankings />} />
          <Route path="/compare"    element={<Compare />} />
          <Route path="/city/:name" element={<CityDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}
