import { useTheme } from "../context/ThemeContext";

export default function Navbar({ lastUpdated }) {
  const { dark, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-light-border 
                    dark:border-dark-border bg-light-card/80 
                    dark:bg-dark-card/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex 
                      items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-lg">🌫️</span>
          <span className="font-semibold text-sm tracking-wide">
            Air Quality Analyzer
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-light-muted dark:text-dark-muted font-mono hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg border border-light-border 
                       dark:border-dark-border flex items-center 
                       justify-center hover:border-accent 
                       transition-colors text-sm"
            aria-label="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </nav>
  );
}
