import { browsers } from "./browsers";
import { categories } from "./categories";
import { distributions } from "./distributions";

export interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  path?: string;
  status: "available" | "coming-soon";
  keywords: string;
}

const searchIndex: SearchResult[] = [
  ...distributions.map((distribution) => ({
    id: `distribution-${distribution.slug}`,
    title: distribution.name,
    category: "Linux distribution",
    description: distribution.status === "available" ? distribution.description : "Distribution support is planned. Installation guides are not available yet.",
    path: distribution.status === "available" ? "/dashboard/debian" : undefined,
    status: distribution.status,
    keywords: `${distribution.name} ${distribution.description} linux operating system distro`,
  })),
  ...categories.map((category) => ({
    id: `category-${category.slug}`,
    title: category.name,
    category: "Debian category",
    description: category.status === "available" ? category.description : `${category.description} Guides are coming soon; no commands are published yet.`,
    path: category.status === "available" ? `/dashboard/debian/${category.slug}` : undefined,
    status: category.status,
    keywords: `${category.name} ${category.description} ${category.searchTerms.join(" ")} debian install setup configuration guide`,
  })),
  ...browsers.map((browser) => ({
    id: `browser-${browser.slug}`,
    title: browser.name,
    category: "Debian browser guide",
    description: browser.description,
    path: `/dashboard/debian/browsers/${browser.slug}`,
    status: "available" as const,
    keywords: `${browser.name} ${browser.shortName} ${browser.description} ${browser.searchTerms.join(" ")} ${browser.steps.map((step) => `${step.title} ${step.description} ${step.command}`).join(" ")} debian stable`,
  })),
];

export function findSearchResults(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const words = normalized.split(/\s+/).filter(Boolean);
  return searchIndex
    .map((item) => {
      const haystack = `${item.title} ${item.category} ${item.description} ${item.keywords}`.toLowerCase();
      const exactMatch = haystack.includes(normalized);
      const wordMatch = words.every((word) => haystack.includes(word));
      const score = (item.title.toLowerCase().includes(normalized) ? 4 : 0) + (exactMatch ? 2 : 0) + (wordMatch ? 1 : 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, 9)
    .map(({ item }) => item);
}