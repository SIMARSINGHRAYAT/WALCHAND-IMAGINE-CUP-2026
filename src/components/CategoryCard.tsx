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
  ArrowUpRight,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { SoftwareCategory } from "../data/categories";

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

export function CategoryCard({ category }: { category: SoftwareCategory }) {
  const Icon = categoryIcons[category.icon] ?? Package;
  const available = category.status === "available";
  const content = (
    <>
      <div className="category-card-heading">
        <span className="category-card-icon"><Icon size={18} /></span>
        <span className={`category-status${available ? " category-status-live" : ""}`}>
          {available ? "01 guide" : "Coming soon"}
        </span>
      </div>
      <h2>{category.name}</h2>
      <p>{category.description}</p>
      <span className={`category-card-link${available ? "" : " category-link-disabled"}`}>
        {available ? "Browse category" : "Content in progress"}
        {available ? <ArrowUpRight size={15} /> : <LockKeyhole size={13} />}
      </span>
    </>
  );

  return available ? (
    <Link className="category-card" to={`/dashboard/debian/${category.slug}`}>
      {content}
    </Link>
  ) : (
    <article className="category-card category-card-soon" aria-label={`${category.name}, coming soon`}>
      {content}
    </article>
  );
}