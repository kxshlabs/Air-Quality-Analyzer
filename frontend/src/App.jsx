import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { useAQIData } from "./hooks/useAQIData";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Rankings from "./pages/Rankings";
import CityDetail from "./pages/CityDetail";

function AppShell() {
  const { cities, rankings, refetch } = useAQIData();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-[#06060f] text-light-text dark:text-dark-text flex flex-col font-sans transition-colors duration-300">
      <Navbar
        globalAqi={rankings?.average_aqi}
        cities={cities}
        onRefresh={refetch}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/city/:name" element={<CityDetail />} />
          {/* Legacy compare route redirects to analytics duel */}
          <Route path="/compare" element={<Navigate to="/analytics" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
