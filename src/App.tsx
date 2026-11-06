import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CommandSearch } from "./components/CommandSearch";
import { SiteFooter, SiteHeader, type ThemeMode } from "./components/SiteShell";
import { ToastProvider } from "./components/ToastProvider";
import { usePersistentState } from "./hooks/usePersistentState";
import { BrowserLibrary } from "./pages/BrowserLibrary";
import { DebianDashboard } from "./pages/DebianDashboard";
import { DistributionDashboard } from "./pages/DistributionDashboard";
import { InstallationGuide } from "./pages/InstallationGuide";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DebianWorkspace } from "./layouts/DebianWorkspace";

function Application() {
  const location = useLocation();
  const [theme, setTheme] = usePersistentState<ThemeMode>("shortcut-theme", "dark");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader
        onSearch={() => setSearchOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />
      <main id="main-content" className="site-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="route-frame"
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DistributionDashboard />} />
              <Route
                path="/dashboard/debian"
                element={<DebianWorkspace activeCategory="overview"><DebianDashboard /></DebianWorkspace>}
              />
              <Route path="/dashboard/debian/browsers" element={<BrowserLibrary />} />
              <Route path="/dashboard/debian/browsers/:browserSlug" element={<InstallationGuide />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Application />
      </BrowserRouter>
    </ToastProvider>
  );
}
