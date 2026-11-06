export interface SoftwareCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  status: "available" | "coming-soon";
  searchTerms: string[];
}

export const categories: SoftwareCategory[] = [
  {
    slug: "browsers",
    name: "Browsers",
    description: "Install and maintain the web browsers you rely on.",
    icon: "globe",
    status: "available",
    searchTerms: ["web browser", "chrome", "firefox", "chromium", "brave", "edge", "opera"],
  },
  {
    slug: "development-tools",
    name: "Development Tools",
    description: "Editors, version control, containers, and daily tools.",
    icon: "code",
    status: "coming-soon",
    searchTerms: ["git", "docker", "vscode", "visual studio code", "development", "editor"],
  },
  {
    slug: "programming-languages",
    name: "Programming Languages",
    description: "Language runtimes, compilers, and package managers.",
    icon: "braces",
    status: "coming-soon",
    searchTerms: ["python", "node.js", "nodejs", "rust", "go", "java", "programming"],
  },
  {
    slug: "communication",
    name: "Communication",
    description: "Stay connected with messaging and collaboration tools.",
    icon: "messages",
    status: "coming-soon",
    searchTerms: ["discord", "slack", "zoom", "communication", "chat"],
  },
  {
    slug: "multimedia",
    name: "Multimedia",
    description: "Audio, video, image editing, and creative applications.",
    icon: "media",
    status: "coming-soon",
    searchTerms: ["vlc", "gimp", "obs", "video", "audio", "multimedia"],
  },
  {
    slug: "office-productivity",
    name: "Office & Productivity",
    description: "Documents, notes, calendars, and focused work.",
    icon: "briefcase",
    status: "coming-soon",
    searchTerms: ["libreoffice", "office", "productivity", "documents"],
  },
  {
    slug: "system-utilities",
    name: "System Utilities",
    description: "Useful tools for keeping a Debian system in shape.",
    icon: "wrench",
    status: "coming-soon",
    searchTerms: ["system", "utility", "utilities", "disk", "backup"],
  },
  {
    slug: "security-tools",
    name: "Security Tools",
    description: "Practical security software and system hardening.",
    icon: "shield",
    status: "coming-soon",
    searchTerms: ["security", "privacy", "firewall", "encryption"],
  },
  {
    slug: "drivers",
    name: "Drivers",
    description: "Hardware support and device-specific setup guides.",
    icon: "circuit",
    status: "coming-soon",
    searchTerms: ["driver", "nvidia", "wifi", "hardware", "graphics"],
  },
  {
    slug: "package-management",
    name: "Package Management",
    description: "APT basics, repositories, and package maintenance.",
    icon: "package",
    status: "coming-soon",
    searchTerms: ["apt", "dpkg", "repository", "packages", "package manager"],
  },
  {
    slug: "desktop-customization",
    name: "Desktop Customization",
    description: "Personalize your desktop environment and workflow.",
    icon: "palette",
    status: "coming-soon",
    searchTerms: ["gnome", "themes", "desktop", "customization", "appearance"],
  },
];