import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFoundPage() {
  usePageMeta("Page not found", "The requested Linux Shortcut Center page could not be found.");

  return (
    <div className="not-found-page page-container">
      <span className="not-found-code">404 / NOT FOUND</span>
      <h1>This path isn't in the library.</h1>
      <p>Check the address or head back to the Debian software library.</p>
      <div className="not-found-actions">
        <Link className="button button-primary" to="/dashboard/debian"><ArrowLeft size={15} /> Debian library</Link>
        <Link className="button button-quiet" to="/dashboard"><Search size={15} /> Browse distributions</Link>
      </div>
    </div>
  );
}