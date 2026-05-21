// src/components/MobileWorkspace.jsx

import { useState, useEffect } from "react";
import MobileSwipeDeck from "./MobileSwipeDeck";
import MobileTemplateEditor from "./MobileTemplateEditor";
import MobileDataScanner from "./MobileDataScanner";
import { FileText, QrCode, Smartphone } from "lucide-react";

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
}) {
  const [view, setView] = useState(initialView); // 'deck', 'templates', or 'scan'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [contactReports, setContactReports] = useState({});
  const deckCount = contacts.length + (reportBackSettings.enabled ? 1 : 0);

  // Simple responsive check (optional)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isMobile) {
    // Fallback – render nothing; parent App handles desktop layout.
    return null;
  }

  return (
    <div
      className="mobile-workspace glass-card-mobile bg-texture"
      style={styles.container}
    >
      {/* Top Header */}
      <header style={styles.header} className="glow-text">
        <h2 style={styles.title}>
          TENANT<span style={styles.actGreen}>ACT</span> |{" "}
          <span style={styles.actGreen}>REACH</span>OUT
        </h2>
        {view === "deck" && (
          <span style={styles.progress}>
            {Math.min(currentIdx + 1, deckCount)} of {deckCount}
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
            initialIndex={currentIdx}
          />
        ) : view === "templates" ? (
          <MobileTemplateEditor
            templates={templates}
            setTemplates={setTemplates}
            extraChannelsEnabled={extraChannelsEnabled}
            setExtraChannelsEnabled={setExtraChannelsEnabled}
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
              setView("deck");
            }}
          />
        )}
      </main>

      {/* Bottom navbar */}
      <nav style={styles.navBar} className="glass-card">
        <button
          onClick={() => setView("deck")}
          style={{
            ...styles.navBtn,
            ...(view === "deck" ? styles.navBtnActive : {}),
          }}
        >
          <Smartphone size={20} /> Contacts
        </button>
        <button
          onClick={() => setView("templates")}
          style={{
            ...styles.navBtn,
            ...(view === "templates" ? styles.navBtnActive : {}),
          }}
        >
          <FileText size={20} /> Set up
        </button>
        <button
          onClick={() => setView("scan")}
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
    backgroundColor: "var(--ta-dark-2)",
    color: "var(--ta-cream)",
    overflow: "hidden",
  },
  header: {
    padding: "2px 6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "24px",
    margin: 0,
  },
  progress: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--ta-green)",
  },
  main: {
    height: "100dvh",
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-around",
    padding: "4px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  navBtnActive: {
    color: "var(--ta-green)",
  },
};
