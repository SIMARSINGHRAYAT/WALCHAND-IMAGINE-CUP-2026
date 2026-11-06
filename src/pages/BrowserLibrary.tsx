import { useMemo, useState, type CSSProperties } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { BrowserCard } from "../components/BrowserCard";
import { DebianWorkspace } from "../layouts/DebianWorkspace";
import { browsers } from "../data/browsers";
import { usePersistentState } from "../hooks/usePersistentState";
import { usePageMeta } from "../hooks/usePageMeta";

type BrowserFilter = "all" | "saved" | "Debian archive" | "Vendor repository" | "Official .deb";

export function BrowserLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BrowserFilter>("all");
  const [favorites, setFavorites] = usePersistentState<string[]>("shortcut-favorite-guides", []);
  const methods: BrowserFilter[] = ["all", "saved", "Debian archive", "Vendor repository", "Official .deb"];

  usePageMeta(
    "Debian web browsers",
    "Compare six browser installation guides for Debian, including official repositories, Debian packages, compatibility, and copyable terminal steps.",
  );

  const visibleBrowsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return browsers.filter((browser) => {
      const matchesQuery = !normalizedQuery || `${browser.name} ${browser.description} ${browser.installMethod} ${browser.searchTerms.join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === "all"
        || (filter === "saved" && favorites.includes(browser.slug))
        || browser.methodFilter === filter;
      return matchesQuery && matchesFilter;
    });
  }, [favorites, filter, query]);

  const toggleFavorite = (slug: string) => {
    setFavorites((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  };

  return (
    <DebianWorkspace activeCategory="browsers">
      <div className="dashboard-page browser-library-page">
        <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Debian", to: "/dashboard/debian" }, { label: "Browsers" }]} />
        <div className="page-heading browser-library-heading">
          <span className="eyebrow">DEBIAN / SOFTWARE</span>
          <h1>Web browsers</h1>
          <p>Install and configure your favourite web browsers on Debian Linux using step-by-step terminal commands.</p>
        </div>

        <div className="browser-library-toolbar">
          <label className="library-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter browsers..."
              aria-label="Filter browsers by name or installation method"
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear browser filter">Clear</button>}
          </label>
          <div className="browser-filter-heading"><SlidersHorizontal size={14} /><span>Filter</span></div>
          <div className="browser-filter-tabs" role="group" aria-label="Filter browser installation methods">
            {methods.map((method) => {
              const label = method === "all" ? "All browsers" : method === "saved" ? `Saved ${favorites.length ? `(${favorites.length})` : ""}`.trim() : method;
              return (
                <button
                  className={filter === method ? "is-active" : ""}
                  key={method}
                  onClick={() => setFilter(method)}
                  aria-pressed={filter === method}
                >
                  {method === "saved" && <Star size={13} />}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="browser-results-heading">
          <h2>{filter === "saved" ? "Saved browser guides" : "Available guides"}</h2>
          <span>{visibleBrowsers.length} {visibleBrowsers.length === 1 ? "browser" : "browsers"}</span>
        </div>

        {visibleBrowsers.length ? (
          <div className="browser-grid">
            {visibleBrowsers.map((browser, index) => (
              <div className="browser-grid-item" key={browser.slug} style={{ "--card-order": index } as CSSProperties}>
                <BrowserCard
                  guide={browser}
                  favorite={favorites.includes(browser.slug)}
                  onToggleFavorite={() => toggleFavorite(browser.slug)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon"><Search size={19} /></span>
            <h2>{filter === "saved" && !favorites.length ? "No saved guides yet" : "No browsers found"}</h2>
            <p>{filter === "saved" && !favorites.length ? "Use the star on a browser guide to keep it here." : "Try a different browser name or installation method."}</p>
            {filter !== "all" && <button className="text-link-button" onClick={() => setFilter("all")}>Show all browsers</button>}
          </div>
        )}

        <div className="command-safety-note">
          <span className="command-safety-mark"><Star size={14} /></span>
          <p><strong>Commands are references, not actions.</strong> Nothing is executed by this site. Review every command before running it in your own terminal.</p>
        </div>
      </div>
    </DebianWorkspace>
  );
}