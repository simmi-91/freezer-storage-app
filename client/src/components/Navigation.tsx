import type { ViewMode } from "../types";

interface NavigationProps {
  currentView: ViewMode["kind"];
  totalItems: number;
  onNavigate: (mode: ViewMode) => void;
}

export function Navigation({ currentView, totalItems, onNavigate }: NavigationProps) {
  const isDashboard = currentView === "dashboard";
  const isList = currentView === "list";

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="nav-sidebar" aria-label="Main navigation">
        <div className="nav-sidebar-links" role="tablist" aria-label="Views">
          <button
            className={`nav-link${isDashboard ? " nav-link--active" : ""}`}
            role="tab"
            aria-selected={isDashboard}
            onClick={() => onNavigate({ kind: "dashboard" })}
          >
            Dashboard
          </button>
          <button
            className={`nav-link${isList ? " nav-link--active" : ""}`}
            role="tab"
            aria-selected={isList}
            onClick={() => onNavigate({ kind: "list" })}
          >
            Items
          </button>
        </div>
        <div className="nav-sidebar-count">
          {totalItems} item{totalItems !== 1 ? "s" : ""} total
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="nav-bottom" aria-label="Main navigation">
        <button
          className={`nav-tab${isDashboard ? " nav-tab--active" : ""}`}
          role="tab"
          aria-selected={isDashboard}
          onClick={() => onNavigate({ kind: "dashboard" })}
        >
          Dashboard
        </button>
        <button
          className={`nav-tab${isList ? " nav-tab--active" : ""}`}
          role="tab"
          aria-selected={isList}
          onClick={() => onNavigate({ kind: "list" })}
        >
          Items
        </button>
      </nav>
    </>
  );
}
