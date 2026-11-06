import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, ClipboardCheck, Copy, RotateCcw, ShieldCheck, Star } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { BrandLogo } from "../components/Brand";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { TerminalBlock } from "../components/TerminalBlock";
import { useClipboard } from "../hooks/useClipboard";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePersistentState } from "../hooks/usePersistentState";
import { browsers } from "../data/browsers";
import { DebianWorkspace } from "../layouts/DebianWorkspace";
import { useToast } from "../components/ToastProvider";

export function InstallationGuide() {
  const { browserSlug = "" } = useParams();
  const guide = browsers.find((browser) => browser.slug === browserSlug);
  const [favorites, setFavorites] = usePersistentState<string[]>("shortcut-favorite-guides", []);
  const [, setRecent] = usePersistentState<string[]>("shortcut-recent-guides", []);
  const [completed, setCompleted] = usePersistentState<Record<string, boolean>>(`shortcut-checklist-${browserSlug}`, {});
  const { copy, copied } = useClipboard();
  const { showToast } = useToast();

  usePageMeta(
    guide ? `Install ${guide.name} on Debian` : "Installation guide not found",
    guide ? `${guide.description} Follow Debian compatibility notes and copy each official installation command step by step.` : "Choose an available Debian installation guide from the browser library.",
  );

  useEffect(() => {
    if (!guide) return;
    setRecent((current) => [guide.slug, ...current.filter((slug) => slug !== guide.slug)].slice(0, 6));
  }, [guide, setRecent]);

  if (!guide) return <Navigate to="/dashboard/debian/browsers" replace />;

  const isFavorite = favorites.includes(guide.slug);
  const completedCount = guide.steps.reduce((count, _, index) => count + (completed[String(index)] ? 1 : 0), 0);
  const toggleFavorite = () => {
    setFavorites((current) => current.includes(guide.slug) ? current.filter((slug) => slug !== guide.slug) : [...current, guide.slug]);
    showToast(isFavorite ? "Removed from saved guides" : "Saved to your browser guides", "success");
  };

  const copyProcedure = async () => {
    const procedure = guide.steps
      .map((step, index) => `# Step ${String(index + 1).padStart(2, "0")}: ${step.title}\n${step.command}`)
      .join("\n\n");
    const success = await copy(procedure);
    showToast(success ? "Complete procedure copied" : "Clipboard access is unavailable", success ? "success" : "error");
  };

  const resetChecklist = () => {
    setCompleted({});
    showToast("Checklist reset", "info");
  };

  return (
    <DebianWorkspace activeCategory="browsers">
      <div className="dashboard-page guide-page">
        <Breadcrumbs items={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Debian", to: "/dashboard/debian" },
          { label: "Browsers", to: "/dashboard/debian/browsers" },
          { label: guide.shortName },
        ]} />

        <Link className="back-link" to="/dashboard/debian/browsers"><ArrowLeft size={14} /> All browser guides</Link>

        <section className="guide-hero">
          <div className="guide-title-group">
            <BrandLogo slug={guide.logo} color={guide.color} name={guide.name} />
            <div>
              <div className="guide-kicker"><span>DEBIAN INSTALL GUIDE</span><i /> REVIEWED {guide.lastVerified}</div>
              <h1>{guide.name}</h1>
              <p>{guide.description}</p>
            </div>
          </div>
          <div className="guide-hero-actions">
            <button className={`guide-favorite-button${isFavorite ? " is-favorite" : ""}`} onClick={toggleFavorite} aria-pressed={isFavorite}>
              <Star size={15} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "Saved" : "Save guide"}
            </button>
            <a className="button button-quiet guide-official-link" href={guide.officialUrl} target="_blank" rel="noreferrer">
              Official website <ArrowUpRight size={14} />
            </a>
          </div>
        </section>

        <div className="guide-status-line">
          <span className="guide-status-check"><Check size={13} /></span>
          <span>Debian compatible</span>
          <i />
          <span>{guide.installMethod}</span>
          <i />
          <a href={guide.documentationUrl} target="_blank" rel="noreferrer">Source: {guide.documentationLabel} <ArrowUpRight size={12} /></a>
        </div>

        <div className="guide-callout guide-safety-callout">
          <ShieldCheck size={18} />
          <div>
            <strong>Nothing runs from this page.</strong>
            <p>Commands are only displayed and copied. Read each step first; commands using <code>sudo</code> make system-level changes.</p>
          </div>
        </div>

        {guide.caution && (
          <div className="guide-callout guide-warning-callout">
            <CircleAlert size={17} />
            <div><strong>Before you begin</strong><p>{guide.caution}</p></div>
          </div>
        )}

        <div className="guide-workspace">
          <section className="guide-steps-column" aria-labelledby="installation-steps-heading">
            <div className="guide-steps-header">
              <div>
                <span className="eyebrow">INSTALLATION</span>
                <h2 id="installation-steps-heading">Follow the steps</h2>
                <p>Run each command in order. A step only counts when you mark it complete.</p>
              </div>
              <button className={`copy-procedure-button${copied ? " is-copied" : ""}`} onClick={copyProcedure}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy all commands"}
              </button>
            </div>

            <div className="checklist-progress" aria-live="polite">
              <div className="checklist-progress-label"><span><ClipboardCheck size={14} /> Installation checklist</span><strong>{completedCount} of {guide.steps.length} complete</strong></div>
              <div className="checklist-progress-track"><span style={{ width: `${(completedCount / guide.steps.length) * 100}%` }} /></div>
              {completedCount > 0 && <button className="checklist-reset" onClick={resetChecklist}><RotateCcw size={12} /> Reset checklist</button>}
            </div>

            <div className="guide-step-list">
              {guide.steps.map((step, index) => {
                const stepKey = String(index);
                const isComplete = Boolean(completed[stepKey]);
                return (
                  <motion.article
                    className={`guide-step${isComplete ? " is-complete" : ""}`}
                    key={`${guide.slug}-${step.title}`}
                    initial={{ opacity: 0, y: 9 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.18) }}
                  >
                    <div className="guide-step-rail">
                      <span className="guide-step-number">{String(index + 1).padStart(2, "0")}</span>
                      {index < guide.steps.length - 1 && <span className="guide-step-connector" />}
                    </div>
                    <div className="guide-step-content">
                      <div className="guide-step-heading-row">
                        <div><h3>{step.title}</h3><p>{step.description}</p></div>
                        <label className="step-complete-toggle">
                          <input
                            type="checkbox"
                            checked={isComplete}
                            onChange={(event) => setCompleted((current) => ({ ...current, [stepKey]: event.target.checked }))}
                          />
                          <span className="step-checkbox" aria-hidden="true"><Check size={12} /></span>
                          <span className="step-toggle-text">{isComplete ? "Done" : "Mark done"}</span>
                        </label>
                      </div>
                      <TerminalBlock command={step.command} />
                      {step.note && <p className="guide-step-note"><CircleAlert size={13} /> {step.note}</p>}
                    </div>
                  </motion.article>
                );
              })}
            </div>

            <section className="guide-uninstall-section">
              <div>
                <span className="eyebrow">OPTIONAL</span>
                <h2>Remove {guide.shortName}</h2>
                <p>This removes the browser package. It does not remove personal profile data.</p>
              </div>
              <TerminalBlock command={guide.uninstallCommand} />
            </section>

            <section className="guide-troubleshooting">
              <div className="guide-section-title"><div><span className="eyebrow">IF SOMETHING GOES WRONG</span><h2>Common checks</h2></div></div>
              {guide.troubleshooting.map((item) => (
                <details className="troubleshooting-item" key={item.title}>
                  <summary>{item.title}</summary>
                  <div className="troubleshooting-body">
                    <p>{item.body}</p>
                    {item.command && <TerminalBlock command={item.command} compact />}
                  </div>
                </details>
              ))}
            </section>
          </section>

          <aside className="guide-details-column" aria-label="Installation guide details">
            <div className="guide-details-panel">
              <div className="guide-details-heading"><span>GUIDE DETAILS</span><ShieldCheck size={16} /></div>
              <dl>
                <div><dt>Distribution</dt><dd>Debian</dd></div>
                <div><dt>Debian versions</dt><dd>{guide.supportedDebian}</dd></div>
                <div><dt>Architecture</dt><dd>{guide.architectures}</dd></div>
                <div><dt>Install method</dt><dd>{guide.installMethod}</dd></div>
                <div><dt>Last verified</dt><dd>{guide.lastVerified}</dd></div>
              </dl>
              <div className="guide-detail-links">
                <a href={guide.officialUrl} target="_blank" rel="noreferrer">Official website <ArrowUpRight size={13} /></a>
                <a href={guide.documentationUrl} target="_blank" rel="noreferrer">Installation source <ArrowUpRight size={13} /></a>
              </div>
            </div>
            <div className="guide-side-note">
              <span className="guide-side-note-icon"><ShieldCheck size={15} /></span>
              <p>Use packages from the vendor or Debian archive. Never disable APT signature checks to resolve an install error.</p>
            </div>
            <Link className="guide-back-browsers" to="/dashboard/debian/browsers"><ArrowLeft size={14} /> Browse other browsers</Link>
          </aside>
        </div>
      </div>
    </DebianWorkspace>
  );
}