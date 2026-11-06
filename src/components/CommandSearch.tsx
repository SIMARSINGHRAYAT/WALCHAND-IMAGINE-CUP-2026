import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowDown, ArrowUp, CornerDownLeft, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { findSearchResults } from "../data/search";
import { useToast } from "./ToastProvider";

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

const suggestions = ["Install Brave on Debian", "Google Chrome", "Install Git", "Python installation"];

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const results = useMemo(() => findSearchResults(query), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const openResult = (index: number) => {
    const result = results[index];
    if (!result) return;
    if (result.path) {
      navigate(result.path);
      onClose();
    } else {
      showToast(`${result.title} guides are coming soon. No commands are available yet.`, "info");
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results.length) {
      event.preventDefault();
      openResult(activeIndex);
    }
  };

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled)");
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="search-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="search-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Search Linux Shortcut Center" onKeyDown={handleDialogKeyDown}>
        <div className="search-dialog-input-row">
          <Search size={19} className="search-dialog-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search software, commands, categories..."
            aria-label="Search software, commands, categories, and distributions"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="search-escape" onClick={onClose} aria-label="Close search"><X size={16} /></button>
        </div>

        <div className="search-dialog-body">
          {query.trim() ? (
            results.length ? (
              <>
                <div className="search-section-title">SEARCH RESULTS <span>{results.length}</span></div>
                <div className="search-result-list" role="listbox" aria-label="Search results">
                  {results.map((result, index) => (
                    <div className={`search-result${activeIndex === index ? " is-selected" : ""}`} role="option" aria-selected={activeIndex === index} key={result.id}>
                      {result.path ? (
                        <Link to={result.path} onClick={onClose}>
                          <span className="search-result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.category} <i /> {result.description}</small>
                          </span>
                          <span className="search-result-status search-status-available">Open</span>
                        </Link>
                      ) : (
                        <button type="button" onClick={() => openResult(index)}>
                          <span className="search-result-copy">
                            <strong>{result.title}</strong>
                            <small>{result.category} <i /> {result.description}</small>
                          </span>
                          <span className="search-result-status">Coming soon</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="search-empty">
                <span className="search-empty-icon"><Search size={18} /></span>
                <strong>No matches for &ldquo;{query.trim()}&rdquo;</strong>
                <p>Try a browser, Linux distribution, command, or category name.</p>
              </div>
            )
          ) : (
            <>
              <div className="search-section-title">QUICK SEARCHES</div>
              <div className="search-suggestions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => setQuery(suggestion)}>
                    <Search size={14} />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
              <div className="search-empty-hint">Search across applications, categories, distributions, and command text.</div>
            </>
          )}
        </div>

        <div className="search-dialog-footer">
          <span><kbd><ArrowUp size={11} /><ArrowDown size={11} /></kbd> Navigate</span>
          <span><kbd><CornerDownLeft size={11} /></kbd> Open result</span>
          <span><kbd>esc</kbd> Close</span>
        </div>
      </section>
    </div>
  );
}