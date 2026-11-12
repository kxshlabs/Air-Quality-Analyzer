import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getAQIColor, formatAQI } from "../utils/aqiHelpers";

export default function Navbar({ globalAqi, cities = [], onRefresh }) {
  const { dark, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Auto-refresh every 60s if onRefresh provided
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 60000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = searchQuery.trim()
    ? cities.filter((c) =>
        c.city.toLowerCase().includes(searchQuery.toLowerCase().trim())
      ).slice(0, 8)
    : cities.slice(0, 6);

  const handleSelectCity = (cityName) => {
    setSearchOpen(false);
    setSearchQuery("");
    setMobileMenuOpen(false);
    navigate(`/city/${encodeURIComponent(cityName)}`);
  };

  const navLinks = [
    { to: "/", label: "Overview", icon: "🌐" },
    { to: "/analytics", label: "Analytics", icon: "📊" },
    { to: "/rankings", label: "Rankings", icon: "🏆" },
  ];

  const aqiColor = getAQIColor(globalAqi);

  return (
    <nav className="sticky top-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <NavLink
          to="/"
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-8 h-8">
            <svg
              className="w-7 h-7 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="url(#orb-grad)"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                className="animate-[spin_12s_linear_infinite]"
              />
              <circle
                cx="16"
                cy="16"
                r="8"
                fill="url(#orb-core)"
                className="animate-pulse"
              />
              <defs>
                <linearGradient id="orb-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
                <radialGradient id="orb-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#0369a1" />
                </radialGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-md pointer-events-none" />
          </div>

          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg tracking-tight text-light-text dark:text-white flex items-center gap-1.5">
              Air<span className="text-accent">Scope</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-light-muted dark:text-dark-muted hidden sm:inline-block">
              AQI Monitor
            </span>
          </div>
        </NavLink>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 backdrop-blur-sm">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-white shadow-sm shadow-accent/30 font-semibold"
                    : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* City Search Button */}
          <div className="relative" ref={searchContainerRef}>
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Search cities"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                searchOpen
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>City Search</span>
            </button>

            {/* Floating City Search Dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 glass-card p-3 shadow-2xl z-50 border border-black/10 dark:border-white/15 animate-fade-in-up">
                <div className="relative mb-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type city name..."
                    className="w-full bg-light-bg dark:bg-dark-bg/80 border border-light-border dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-light-text dark:text-white placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:border-accent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-light-muted hover:text-light-text dark:hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredCities.length === 0 ? (
                    <div className="text-center py-4 text-xs text-light-muted dark:text-dark-muted">
                      No matching cities
                    </div>
                  ) : (
                    filteredCities.map((c) => {
                      const color = getAQIColor(c.aqi);
                      return (
                        <button
                          key={c.city}
                          onClick={() => handleSelectCity(c.city)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs hover:bg-black/5 dark:hover:bg-white/10 text-left transition-colors"
                        >
                          <span className="font-medium text-light-text dark:text-white">
                            {c.city}
                          </span>
                          <span
                            className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `${color}25`,
                              color,
                            }}
                          >
                            AQI {formatAQI(c.aqi)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Global AQI Chip + Dark Mode Toggle + Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          {/* Live Global AQI Chip */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-sm text-xs font-mono"
            title="Global average AQI across all tracked cities"
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: aqiColor }}
            />
            <span className="text-light-muted dark:text-dark-muted hidden sm:inline">
              Global AQI:
            </span>
            <span className="font-bold text-light-text dark:text-white">
              {formatAQI(globalAqi)}
            </span>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center hover:border-accent hover:text-accent transition-colors text-light-text dark:text-white focus:outline-none"
          >
            {dark ? (
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden w-9 h-9 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center text-light-text dark:text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-nav border-t border-black/5 dark:border-white/10 px-4 py-3 space-y-2 animate-fade-in-up">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white font-semibold"
                    : "text-light-muted dark:text-dark-muted hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* Mobile City Quick Search */}
          <div className="pt-2 border-t border-black/5 dark:border-white/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city..."
              className="w-full bg-light-bg dark:bg-dark-bg/80 border border-light-border dark:border-white/10 rounded-lg px-3 py-2 text-xs text-light-text dark:text-white placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:border-accent"
            />
            {searchQuery && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {filteredCities.map((c) => (
                  <button
                    key={c.city}
                    onClick={() => handleSelectCity(c.city)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-black/5 dark:hover:bg-white/10 text-left"
                  >
                    <span>{c.city}</span>
                    <span className="font-mono font-bold">
                      AQI {formatAQI(c.aqi)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
