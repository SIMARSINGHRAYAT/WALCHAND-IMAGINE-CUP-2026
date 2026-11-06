import { useState } from "react";
import { ArrowUpRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "./Brand";

export type ThemeMode = "dark" | "light";

interface SiteHeaderProps {
  onSearch: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function SiteHeader({ onSearch, theme, onToggleTheme }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="site-brand" to="/" onClick={closeMobile} aria-label="Linux Shortcut Center home">
          <BrandMark />
          <span>Linux Shortcut <b>Center</b></span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>Home</NavLink>
          <NavLink to="/dashboard" end className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>Operating systems</NavLink>
          <NavLink to="/dashboard/debian" className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>Categories</NavLink>
          <Link className="nav-link" to="/#how-it-works">About</Link>
          <a className="nav-link nav-github" href="https://github.com" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={13} />
          </a>
        </nav>

        <div className="header-actions">
          <button className="header-search-button" onClick={onSearch} aria-label="Open search">
            <Search size={16} />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button className="theme-toggle" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <Link className="button button-primary header-cta" to="/dashboard">Get started</Link>
          <button className="mobile-menu-toggle" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" end onClick={closeMobile}>Home</NavLink>
          <NavLink to="/dashboard" onClick={closeMobile}>Operating systems</NavLink>
          <NavLink to="/dashboard/debian" onClick={closeMobile}>Categories</NavLink>
          <Link to="/#how-it-works" onClick={closeMobile}>About</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" onClick={closeMobile}>GitHub <ArrowUpRight size={14} /></a>
          <button onClick={() => { closeMobile(); onSearch(); }}><Search size={15} /> Search the library</button>
          <Link className="button button-primary mobile-nav-cta" to="/dashboard" onClick={closeMobile}>Get started</Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-group">
          <Link className="site-brand footer-brand" to="/">
            <BrandMark />
            <span>Linux Shortcut <b>Center</b></span>
          </Link>
          <p>A clearer path from a fresh Linux install to the tools you need.</p>
        </div>
        <div className="footer-links">
          <div>
            <span className="footer-heading">EXPLORE</span>
            <Link to="/dashboard">Distributions</Link>
            <Link to="/dashboard/debian">Debian library</Link>
            <Link to="/dashboard/debian/browsers">Browsers</Link>
          </div>
          <div>
            <span className="footer-heading">PROJECT</span>
            <Link to="/#how-it-works">About the library</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12} /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Linux Shortcut Center</span>
        <span>Commands are never run by this website.</span>
      </div>
    </footer>
  );
}