import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Boxes, Check, Compass, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { BrandMark } from "../components/Brand";
import { TerminalBlock } from "../components/TerminalBlock";

const features = [
  {
    icon: Terminal,
    number: "01",
    title: "Ready-to-use commands",
    description: "Clear, ordered terminal instructions with a copy button on every step.",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "An organized software library",
    description: "Find applications and setup guides grouped into practical categories.",
  },
  {
    icon: Boxes,
    number: "03",
    title: "Built for multiple distributions",
    description: "Start with Debian today. Add other Linux distributions without changing the experience.",
  },
];

const steps = [
  { number: "01", title: "Choose your distribution", detail: "Pick the Linux system installed on your machine." },
  { number: "02", title: "Explore a category", detail: "Browse software by the way you use your computer." },
  { number: "03", title: "Open an application", detail: "Check compatibility, source, and installation details." },
  { number: "04", title: "Copy and run", detail: "Review each command, then run it yourself in a terminal." },
];

export function LandingPage() {
  usePageMeta(
    "Linux commands, in one place",
    "Discover, install, configure, and manage Linux software with verified commands and practical guides. Start with Debian.",
  );

  return (
    <div className="landing-page">
      <section className="landing-hero page-container">
        <div className="hero-glow" aria-hidden="true" />
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <h1 className="hero-brandline">
            <BrandMark large />
            <span>Linux Shortcut Center</span>
            <i />
            <small>THE COMMAND LIBRARY</small>
          </h1>
          <h2 className="hero-main-headline">Your Linux Commands.<br /><span>One Centralized Library.</span></h2>
          <p className="hero-description">
            Discover, install, configure, and manage your favourite Linux applications with verified terminal commands. One platform. Multiple distributions. Unlimited possibilities.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/dashboard">
              Get started <ArrowRight size={16} />
            </Link>
            <Link className="button button-quiet button-large" to="/dashboard">
              Explore distributions <Compass size={16} />
            </Link>
          </div>
          <div className="hero-note"><Check size={14} /> Debian guides available now <span /> No commands run in your browser</div>
        </motion.div>

        <motion.div
          className="hero-terminal-wrap"
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
        >
          <div className="hero-terminal-topline">
            <span><i /> DEBIAN / BASH</span>
            <span>COMMAND PREVIEW <b>01 / 06</b></span>
          </div>
          <div className="hero-terminal-window">
            <div className="terminal-window-bar">
              <span className="window-dots"><i /><i /><i /></span>
              <span>firefox-esr / install</span>
              <span className="terminal-window-path">~/linux-shortcuts</span>
            </div>
            <div className="hero-terminal-body">
              <div className="terminal-context">
                <span className="terminal-context-label">A first install, made simple.</span>
                <span className="terminal-context-detail">Debian's official package archive</span>
              </div>
              <TerminalBlock command="sudo apt install firefox-esr" label="INSTALL" />
              <div className="hero-terminal-footer">
                <span><span className="hero-pulse" /> Ready to copy</span>
                <span>Review each command before running it</span>
              </div>
            </div>
          </div>
          <div className="hero-terminal-caption"><span>01</span> One verified command. A clear next step.</div>
        </motion.div>
      </section>

      <section className="feature-section page-container" aria-labelledby="features-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">WHY LINUX SHORTCUT CENTER</span>
            <h2 id="features-title">Less searching. More doing.</h2>
          </div>
          <p>Practical Linux guidance, organized around the way you actually work.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, number, title, description }, index) => (
            <motion.article
              className="feature-item"
              key={number}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.42, delay: index * 0.08 }}
            >
              <div className="feature-topline"><span>{number}</span><Icon size={19} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="page-container how-inner">
          <div className="how-heading">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2>Four steps. Your terminal.</h2>
            <p>Find a guide, understand what it does, and stay in control from start to finish.</p>
          </div>
          <div className="steps-flow">
            {steps.map((step, index) => (
              <motion.div
                className="flow-step"
                key={step.number}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
              >
                <span className="flow-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.detail}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta page-container">
        <div className="closing-copy">
          <span className="eyebrow">START WITH DEBIAN</span>
          <h2>Find your next command.</h2>
          <p>Explore the first set of carefully sourced installation guides.</p>
        </div>
        <Link className="button button-primary" to="/dashboard/debian/browsers">
          Browse browser guides <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}