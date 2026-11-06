import { useState, type CSSProperties } from "react";
import { Terminal } from "lucide-react";

export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span className={`brand-mark${large ? " brand-mark-large" : ""}`} aria-hidden="true">
      <Terminal size={large ? 24 : 19} strokeWidth={2.2} />
      <i />
    </span>
  );
}

export function BrandLogo({ slug, color, name }: { slug: string; color: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className="brand-logo" style={{ "--logo-color": color } as CSSProperties} aria-hidden="true">
      {!imageFailed ? (
        <img
          src={`https://cdn.simpleicons.org/${slug}/${color.replace("#", "")}`}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="brand-logo-fallback">{name.slice(0, 1)}</span>
      )}
    </span>
  );
}