// src/components/MobileWorkspace.jsx

import { useState, useEffect } from "react";
import MobileSwipeDeck from "./MobileSwipeDeck";
import MobileTemplateEditor from "./MobileTemplateEditor";
import MobileDataScanner from "./MobileDataScanner";
import { FileText, QrCode, Smartphone } from "lucide-react";
import { initialContacts, initialTemplates } from "../data/mockData";

export default function MobileWorkspace({
  contacts,
  setContacts,
  templates,
  setTemplates,
  setSelectedDialCode,
  selectedDialCode,
  extraChannelsEnabled,
  setExtraChannelsEnabled,
  callNotes = [],
  setCallNotes = () => {},
  reportBackSettings = { enabled: false, phone: "" },
  setReportBackSettings = () => {},
  initialView = "deck",
  theme = "dark",
  onToggleTheme = () => {},
  fontScale = 1,
}) {
  const [view, setView] = useState(initialView); // 'deck', 'templates', or 'scan'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [contactReports, setContactReports] = useState({});
  const [exampleToastDismissed, setExampleToastDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isContactCardOpen = view === "deck" && currentIdx > 0 && currentIdx <= contacts.length;
  const isExampleData =
    contacts.length === initialContacts.length &&
    templates.length === initialTemplates.length &&
    contacts.every(
      (contact, index) =>
        contact.name === initialContacts[index]?.name &&
        contact.phone === initialContacts[index]?.phone
    ) &&
    templates.every(
      (template, index) =>
        template.title === initialTemplates[index]?.title &&
        template.body === initialTemplates[index]?.body
    );
  const showExampleToast = isMobile && isExampleData && !exampleToastDismissed;

  const changeView = (nextView) => {
    setExampleToastDismissed(true);
    setView(nextView);
  };

  // Simple responsive check (optional)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!showExampleToast) return undefined;

    const timeout = window.setTimeout(() => setExampleToastDismissed(true), 4200);
    return () => window.clearTimeout(timeout);
  }, [showExampleToast]);

  if (!isMobile) {
    // Fallback – render nothing; parent App handles desktop layout.
    return null;
  }

  return (
    <div
      className="mobile-workspace glass-card-mobile bg-texture"
      data-theme={theme}
      style={{
        ...styles.container,
        "--reachout-text-scale": fontScale,
      }}
    >
      {/* Top Header */}
      <header style={styles.header} className="glow-text">
        <div style={styles.logoGroup}>
          <h2 style={styles.title}>
            <span style={styles.actGreen}>REACH</span>OUT
          </h2>
          <span style={styles.divider}>|</span>
          <span style={styles.tenantCredit}>
            by Tenant<span style={styles.actGreen}>Act</span>
          </span>
        </div>
        {isContactCardOpen && (
          <span style={styles.progress}>
            {currentIdx} of {contacts.length}
          </span>
        )}
      </header>

      {/* Main view */}
      <main style={styles.main}>
        {view === "deck" ? (
          <MobileSwipeDeck
            key={`${contacts.map((contact) => contact.id).join("|")}-${initialView}`}
            contacts={contacts}
            setContacts={setContacts}
            templates={templates}
            selectedDialCode={selectedDialCode}
            extraChannelsEnabled={extraChannelsEnabled}
            callNotes={callNotes}
            reportBackSettings={reportBackSettings}
            contactReports={contactReports}
            setContactReports={setContactReports}
            onIndexChange={setCurrentIdx}
            onFirstTouch={() => setExampleToastDismissed(true)}
            initialIndex={currentIdx}
          />
        ) : view === "templates" ? (
          <MobileTemplateEditor
            templates={templates}
            setTemplates={setTemplates}
            extraChannelsEnabled={extraChannelsEnabled}
            setExtraChannelsEnabled={setExtraChannelsEnabled}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        ) : (
          <MobileDataScanner
            setContacts={setContacts}
            setTemplates={setTemplates}
            setSelectedDialCode={setSelectedDialCode}
            setExtraChannelsEnabled={setExtraChannelsEnabled}
            setCallNotes={setCallNotes}
            setReportBackSettings={setReportBackSettings}
            onImported={() => {
              setCurrentIdx(0);
              setContactReports({});
              changeView("deck");
            }}
          />
        )}
      </main>

      {showExampleToast && (
        <div style={styles.exampleToast} role="status" aria-live="polite">
          <span style={styles.exampleToastTitle}>Example data</span>
          <span style={styles.exampleToastText}>
            These contacts and templates are here to demo the phonebank. Scan
            data or open a transfer link to load your real setup.
          </span>
          <span className="example-data-toast-progress" aria-hidden="true" />
        </div>
      )}

      {/* Bottom navbar */}
      <nav style={styles.navBar} className="glass-card">
        <button
          onClick={() => changeView("deck")}
          style={{
            ...styles.navBtn,
            ...(view === "deck" ? styles.navBtnActive : {}),
          }}
        >
          <Smartphone size={20} /> Contacts
        </button>
        <button
          onClick={() => changeView("templates")}
          style={{
            ...styles.navBtn,
            ...(view === "templates" ? styles.navBtnActive : {}),
          }}
        >
          <FileText size={20} /> Set up
        </button>
        <button
          onClick={() => changeView("scan")}
          style={{
            ...styles.navBtn,
            ...(view === "scan" ? styles.navBtnActive : {}),
          }}
        >
          <QrCode size={20} /> Scan data
        </button>
      </nav>
    </div>
  );
}

const styles = {
  actGreen: {
    color: "var(--ta-green)",
    textShadow: "none",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    backgroundColor: "var(--modal-card-bg)",
    color: "var(--ta-cream)",
    overflow: "hidden",
  },
  header: {
    minHeight: "36px",
    padding: "4px 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--ta-border-subtle)",
    gap: "8px",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minWidth: 0,
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(25px * var(--reachout-text-scale, 1))",
    margin: 0,
    color: "var(--ta-cream)",
    lineHeight: 1,
    letterSpacing: "0.035em",
    whiteSpace: "nowrap",
  },
  divider: {
    color: "var(--ta-divider)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
  },
  tenantCredit: {
    fontSize: "calc(10.5px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
    letterSpacing: "0.01em",
    lineHeight: 1,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
  },
  progress: {
    fontFamily: "var(--font-mono)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    flexShrink: 0,
  },
  main: {
    height: "100dvh",
    flex: 1,
    overflowY: "auto",
    padding: "6px",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-around",
    padding: "4px",
    borderTop: "1px solid var(--ta-border-subtle)",
  },
  exampleToast: {
    position: "fixed",
    left: "50%",
    top: "50%",
    width: "min(340px, calc(100vw - 24px))",
    transform: "translate(-50%, -50%)",
    zIndex: 2000,
    backgroundColor: "var(--modal-card-bg)",
    border: "1.5px solid rgba(79, 159, 104, 0.58)",
    borderRadius: "12px",
    color: "var(--ta-muted-strong)",
    boxShadow: "var(--modal-card-shadow)",
    padding: "13px 14px 15px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    overflow: "hidden",
  },
  exampleToastTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(17px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    lineHeight: 1,
  },
  exampleToastText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  navBtnActive: {
    color: "var(--ta-green)",
  },
};
