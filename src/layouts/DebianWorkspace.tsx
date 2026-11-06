import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { categories } from "../data/categories";
import { DebianSidebar } from "../components/DebianSidebar";

export function DebianWorkspace({ children, activeCategory }: { children: ReactNode; activeCategory: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <div className="debian-workspace">
      <div className="mobile-library-bar">
        <button className="mobile-library-button" onClick={() => setSidebarOpen((open) => !open)} aria-expanded={sidebarOpen}>
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          <span>{sidebarOpen ? "Close library" : "Debian library"}</span>
          <span className="mobile-library-current">{categories.find((item) => item.slug === activeCategory)?.name ?? "Overview"}</span>
        </button>
      </div>
      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close library navigation" />}
      <DebianSidebar activeCategory={activeCategory} open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="workspace-content">{children}</div>
    </div>
  );
}