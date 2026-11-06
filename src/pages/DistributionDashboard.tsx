import type { CSSProperties } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { OSCard } from "../components/OSCard";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { distributions } from "../data/distributions";
import { usePageMeta } from "../hooks/usePageMeta";

export function DistributionDashboard() {
  usePageMeta(
    "Choose your Linux distribution",
    "Choose a Linux distribution to browse compatible software, installation commands, and configuration guides. Debian is available now.",
  );

  return (
    <div className="page-container dashboard-page distribution-page">
      <Breadcrumbs items={[{ label: "Dashboard" }, { label: "Operating systems" }]} />
      <div className="page-heading distribution-heading">
        <span className="eyebrow">YOUR LINUX WORKSPACE</span>
        <h1>Choose your Linux distribution</h1>
        <p>Select your operating system to explore compatible software, installation commands, and configuration guides.</p>
      </div>
      <div className="distribution-grid">
        {distributions.map((distribution, index) => (
          <div className="distribution-grid-item" key={distribution.slug} style={{ "--card-order": index } as CSSProperties}>
            <OSCard distribution={distribution} />
          </div>
        ))}
      </div>
      <div className="distribution-note">
        <span className="distribution-note-icon"><Search size={17} /></span>
        <div>
          <strong>Only verified paths are shown.</strong>
          <p>Debian is available now. Other distributions will remain unavailable until their guides are ready.</p>
        </div>
        <Link to="/" className="text-link"><ArrowLeft size={14} /> Back home</Link>
      </div>
    </div>
  );
}