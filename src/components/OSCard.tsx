import { ArrowRight, LockKeyhole, Check } from "lucide-react";
import { Link } from "react-router-dom";
import type { Distribution } from "../data/distributions";
import { BrandLogo } from "./Brand";

export function OSCard({ distribution }: { distribution: Distribution }) {
  const available = distribution.status === "available";
  const body = (
    <>
      <div className="os-card-top">
        <BrandLogo slug={distribution.logo} color={distribution.color} name={distribution.name} />
        <span className={`status-label${available ? " status-available" : " status-soon"}`}>
          {available ? <><Check size={12} /> Available</> : <><LockKeyhole size={12} /> Coming soon</>}
        </span>
      </div>
      <div className="os-card-content">
        <h2>{distribution.name}</h2>
        <p>{distribution.description}</p>
      </div>
      {available ? (
        <span className="os-card-action">Explore Debian <ArrowRight size={15} /></span>
      ) : (
        <span className="os-card-action is-disabled">Not available yet <LockKeyhole size={13} /></span>
      )}
    </>
  );

  return available ? (
    <Link to="/dashboard/debian" className="os-card is-available">
      {body}
    </Link>
  ) : (
    <article className="os-card os-card-soon" aria-label={`${distribution.name}, coming soon`}>
      {body}
    </article>
  );
}