export interface Distribution {
  slug: string;
  name: string;
  description: string;
  status: "available" | "coming-soon";
  logo: string;
  color: string;
}

export const distributions: Distribution[] = [
  {
    slug: "ubuntu",
    name: "Ubuntu",
    description: "A friendly, widely used Linux distribution.",
    status: "coming-soon",
    logo: "ubuntu",
    color: "#e95420",
  },
  {
    slug: "kali-linux",
    name: "Kali Linux",
    description: "A Debian-based platform for security work.",
    status: "coming-soon",
    logo: "kalilinux",
    color: "#557c94",
  },
  {
    slug: "fedora",
    name: "Fedora",
    description: "A community-built distribution at the leading edge.",
    status: "coming-soon",
    logo: "fedora",
    color: "#51a2da",
  },
  {
    slug: "linux-mint",
    name: "Linux Mint",
    description: "A comfortable desktop built for everyday use.",
    status: "coming-soon",
    logo: "linuxmint",
    color: "#86be43",
  },
  {
    slug: "debian",
    name: "Debian",
    description: "A dependable foundation with a huge software archive.",
    status: "available",
    logo: "debian",
    color: "#d70a53",
  },
  {
    slug: "arch-linux",
    name: "Arch Linux",
    description: "A flexible, community-driven rolling release.",
    status: "coming-soon",
    logo: "archlinux",
    color: "#1793d1",
  },
];