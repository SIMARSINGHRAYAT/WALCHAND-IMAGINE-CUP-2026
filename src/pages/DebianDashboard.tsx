import type { CSSProperties } from "react";
import { ArrowRight, Clock3, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CategoryCard } from "../components/CategoryCard";
import { browsers } from "../data/browsers";
import { categories } from "../data/categories";
import { usePersistentState } from "../hooks/usePersistentState";
import { usePageMeta } from "../hooks/usePageMeta";

export function DebianDashboard() {
  const [recent] = usePersistentState<string[]>("shortcut-recent-guides", []);
  const [favorites] = usePersistentState<string[]>("shortcut-favorite-guides", []);
  const recentGuides = recent.map((slug) => browsers.find((browser) => browser.slug === slug)).filter((browser) => browser !== undefined);
  const favoriteGuides = favorites.map((slug) => browsers.find((browser) => browser.slug === slug)).filter((browser) => browser !== undefined);

  usePageMeta(
    "Debian software library",
    "Explore essential software categories and verified installation instructions for Debian Linux. The browser library is available now.",
  );

  return (
    <div className="dashboard-page debian-dashboard-page">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/dashboard" }, { label: "Debian" }]} />
      <div className="page-heading debian-heading">
        <span className="eyebrow">DEBIAN / STABLE</span>
        <h1>Debian software library</h1>
        <p>Explore essential software, development tools, browsers, utilities, and Linux configuration guides for Debian.</p>
      </div>

      <div className="library-section-heading">
        <div><span className="eyebrow">EXPLORE THE LIBRARY</span><h2>Software categories</h2></div>
        <span className="section-count">{categories.length} categories</span>
      </div>
      <div className="category-grid">
        {categories.map((category, index) => (
          <div key={category.slug} className="category-grid-item" style={{ "--card-order": index } as CSSProperties}>
            <CategoryCard category={category} />
          </div>
        ))}
      </div>

      {(recentGuides.length > 0 || favoriteGuides.length > 0) && (
        <div className="personal-library-section">
          {recentGuides.length > 0 && (
            <section className="personal-list" aria-labelledby="recent-guides-heading">
              <div className="personal-list-heading"><Clock3 size={15} /><h2 id="recent-guides-heading">Recently viewed</h2></div>
              <div className="personal-link-list">
                {recentGuides.slice(0, 3).map((guide) => (
                  <Link to={`/dashboard/debian/browsers/${guide.slug}`} key={guide.slug}>
                    <span>{guide.name}</span><ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {favoriteGuides.length > 0 && (
            <section className="personal-list" aria-labelledby="favorite-guides-heading">
              <div className="personal-list-heading"><Star size={15} /><h2 id="favorite-guides-heading">Saved guides</h2></div>
              <div className="personal-link-list">
                {favoriteGuides.slice(0, 3).map((guide) => (
                  <Link to={`/dashboard/debian/browsers/${guide.slug}`} key={guide.slug}>
                    <span>{guide.name}</span><ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}