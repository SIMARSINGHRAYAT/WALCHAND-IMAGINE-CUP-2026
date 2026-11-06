import { ArrowRight, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { BrowserGuide } from "../data/browsers";
import { BrandLogo } from "./Brand";

interface BrowserCardProps {
  guide: BrowserGuide;
  favorite: boolean;
  onToggleFavorite: () => void;
}

export function BrowserCard({ guide, favorite, onToggleFavorite }: BrowserCardProps) {
  return (
    <article className="browser-card">
      <div className="browser-card-main">
        <BrandLogo slug={guide.logo} color={guide.color} name={guide.name} />
        <div className="browser-card-copy">
          <div className="browser-card-title-row">
            <h2>{guide.name}</h2>
            <button
              className={`favorite-button${favorite ? " is-favorite" : ""}`}
              onClick={onToggleFavorite}
              aria-label={favorite ? `Remove ${guide.name} from favourites` : `Save ${guide.name} to favourites`}
              aria-pressed={favorite}
              title={favorite ? "Remove from favourites" : "Add to favourites"}
            >
              <Star size={16} fill={favorite ? "currentColor" : "none"} />
            </button>
          </div>
          <p>{guide.description}</p>
        </div>
      </div>
      <div className="browser-card-meta">
        <span><Check size={12} /> Debian</span>
        <span>{guide.installMethod}</span>
      </div>
      <Link className="browser-card-action" to={`/dashboard/debian/browsers/${guide.slug}`}>
        View installation guide <ArrowRight size={15} />
      </Link>
    </article>
  );
}