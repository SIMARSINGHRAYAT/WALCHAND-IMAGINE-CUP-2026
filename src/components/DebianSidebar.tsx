import {
  Braces,
  BriefcaseBusiness,
  CircuitBoard,
  Code2,
  Globe2,
  MessageCircle,
  Music2,
  Package,
  Palette,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { categories } from "../data/categories";
import { BrandMark } from "./Brand";

const categoryIcons: Record<string, LucideIcon> = {
  globe: Globe2,
  code: Code2,
  braces: Braces,
  messages: MessageCircle,
  media: Music2,
  briefcase: BriefcaseBusiness,
  wrench: Wrench,
  shield: ShieldCheck,
  circuit: CircuitBoard,
  package: Package,
  palette: Palette,
};

interface DebianSidebarProps {
  activeCategory: string;
  open: boolean;
  onNavigate: () => void;
}

export function DebianSidebar({ activeCategory, open, onNavigate }: DebianSidebarProps) {
  return (
    <aside className={`debian-sidebar${open ? " is-open" : ""}`} aria-label="Debian software categories">
      <Link className="sidebar-distribution" to="/dashboard/debian" onClick={onNavigate}>
        <BrandMark />
        <span>
          <strong>Debian</strong>
          <small>Software library</small>
        </span>
      </Link>

      <div className="sidebar-section-label">WORKSPACE</div>
      <Link
        className={`sidebar-link${activeCategory === "overview" ? " is-active" : ""}`}
        to="/dashboard/debian"
        onClick={onNavigate}
      >
        <span className="sidebar-link-icon"><Globe2 size={16} /></span>
        <span>Overview</span>
        <span className="sidebar-link-count">01</span>
      </Link>

      <div className="sidebar-section-label sidebar-categories-label">CATEGORIES</div>
      <nav className="sidebar-category-list" aria-label="Software categories">
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon] ?? Package;
          const isAvailable = category.status === "available";
          const isActive = activeCategory === category.slug;
          const content = (
            <>
              <span className="sidebar-link-icon"><Icon size={16} /></span>
              <span className="sidebar-link-name">{category.name}</span>
              {isAvailable ? <span className="sidebar-live-dot" aria-label="Available" /> : <span className="sidebar-soon-label">Soon</span>}
            </>
          );

          return isAvailable ? (
            <Link
              className={`sidebar-link${isActive ? " is-active" : ""}`}
              key={category.slug}
              to={`/dashboard/debian/${category.slug}`}
              onClick={onNavigate}
            >
              {content}
            </Link>
          ) : (
            <div className="sidebar-link sidebar-link-disabled" key={category.slug} aria-disabled="true" title="Content coming soon">
              {content}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footnote">
        <span className="sidebar-footnote-dot" />
        <span>Commands are reviewed against official sources.</span>
      </div>
    </aside>
  );
}