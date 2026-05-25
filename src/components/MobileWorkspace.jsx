// src/components/MobileWorkspace.jsx

import { useState, useEffect, useRef } from "react";
import MobileSwipeDeck from "./MobileSwipeDeck";
import MobileTemplateEditor from "./MobileTemplateEditor";
import MobileDataScanner from "./MobileDataScanner";
import MobileContactsManager from "./MobileContactsManager";
import { FileText, LogOut, PhoneCall, QrCode, Users } from "lucide-react";
import { initialContacts, initialTemplates } from "../data/mockData";
import ProductTour from "./ProductTour";
import { mobileProductTourSteps } from "../data/productTourSteps";
import { CircleHelp } from "lucide-react";
import FaqPage from "./FaqPage";

const MOBILE_TOUR_STORAGE_KEY = "reachout.mobileProductTourSeen";

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
  onCloseFaq = () => {},
  theme = "dark",
  onToggleTheme = () => {},
  fontScale = 1,
}) {
  const [view, setView] = useState(initialView); // 'deck', 'contacts', 'templates', 'scan', or 'faq'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [contactReports, setContactReports] = useState({});
  const [exampleToastDismissed, setExampleToastDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const exitConfirmOpenRef = useRef(false);
  const allowExitRef = useRef(false);
  const contactSignature = contacts
    .map((contact) => `${contact.id}:${contact.name}:${contact.phone}`)
    .join("|");
  const previousContactSignatureRef = useRef(contactSignature);
  const isContactCardOpen =
    view === "deck" && currentIdx > 0 && currentIdx <= contacts.length;
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
  const showExampleToast =
    isMobile && view === "deck" && isExampleData && !exampleToastDismissed;

  const changeView = (nextView) => {
    setExampleToastDismissed(true);
    setView(nextView);
  };

  const openFaq = () => {
    setExampleToastDismissed(true);
    setView("faq");
  };

  const closeFaq = () => {
    setView("deck");
    onCloseFaq();
  };

  // Simple responsive check (optional)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    exitConfirmOpenRef.current = exitConfirmOpen;
  }, [exitConfirmOpen]);

  useEffect(() => {
    if (!isMobile) return undefined;

    window.history.pushState(
      { ...(window.history.state || {}), reachoutExitGuard: true },
      "",
      window.location.href
    );

    const handlePopState = () => {
      if (allowExitRef.current || exitConfirmOpenRef.current) return;

      exitConfirmOpenRef.current = true;
      setExitConfirmOpen(true);
      window.history.forward();
    };

    const handleBeforeUnload = (event) => {
      if (allowExitRef.current) return undefined;

      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!showExampleToast) return undefined;

    const timeout = window.setTimeout(
      () => setExampleToastDismissed(true),
      4200
    );
    return () => window.clearTimeout(timeout);
  }, [showExampleToast]);

  useEffect(() => {
    if (previousContactSignatureRef.current === contactSignature) return;

    previousContactSignatureRef.current = contactSignature;
    if (view === "contacts") return;

    setCurrentIdx(0);
    setContactReports({});
    if (view !== "faq") {
      setView("deck");
    }
    setExampleToastDismissed(true);
  }, [contactSignature, view]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(MOBILE_TOUR_STORAGE_KEY) === "true") {
        return;
      }
    } catch {
      // If storage is unavailable, show once for this render.
    }

    window.setTimeout(() => {
      setView(mobileProductTourSteps[0].view);
      setTourStep(0);
      setIsTourOpen(true);
    }, 0);
  }, []);

  const markTourSeen = () => {
    try {
      window.localStorage.setItem(MOBILE_TOUR_STORAGE_KEY, "true");
    } catch {
      // Ignore storage failures; the tour still works for this session.
    }
  };

  const closeTour = () => {
    markTourSeen();
    setView("deck");
    setIsTourOpen(false);
  };

  const openTour = () => {
    setView(mobileProductTourSteps[0].view);
    setTourStep(0);
    setIsTourOpen(true);
  };

  const handleTourNext = () => {
    if (tourStep >= mobileProductTourSteps.length - 1) {
      closeTour();
      return;
    }

    const nextStep = tourStep + 1;
    const nextView = mobileProductTourSteps[nextStep]?.view;
    if (nextView) {
      setView(nextView);
    }
    setTourStep(nextStep);
  };

  const handleTourPrev = () => {
    if (tourStep === 0) return;
    const prevStep = tourStep - 1;
    const prevView = mobileProductTourSteps[prevStep]?.view;
    if (prevView) {
      setView(prevView);
    }
    setTourStep(prevStep);
  };

  const stayInApp = () => {
    exitConfirmOpenRef.current = false;
    setExitConfirmOpen(false);
  };

  const confirmExit = () => {
    allowExitRef.current = true;
    exitConfirmOpenRef.current = false;
    setExitConfirmOpen(false);
    window.history.back();
  };

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
        <div style={styles.headerActions}>
          {isContactCardOpen && (
            <span style={styles.progress}>
              {currentIdx} of {contacts.length}
            </span>
          )}
          <button
            type="button"
            onClick={openTour}
            aria-label="Open product tour"
            style={styles.tourButton}
          >
            <CircleHelp size={14} />
          </button>
        </div>
      </header>

      {/* Main view */}
      <main style={styles.main}>
        {view === "faq" ? (
          <FaqPage onBack={closeFaq} />
        ) : view === "deck" ? (
          <MobileSwipeDeck
            key={`${contacts
              .map((contact) => contact.id)
              .join("|")}-${initialView}`}
            contacts={contacts}
            setContacts={setContacts}
            templates={templates}
            selectedDialCode={selectedDialCode}
            extraChannelsEnabled={extraChannelsEnabled}
            callNotes={callNotes}
            reportBackSettings={reportBackSettings}
            contactReports={contactReports}
            onIndexChange={(idx) => {
              setCurrentIdx(idx);
            }}
            setContactReports={setContactReports}
            onFirstTouch={() => setExampleToastDismissed(true)}
            initialIndex={currentIdx}
            onOpenFaq={openFaq}
          />
        ) : view === "contacts" ? (
          <MobileContactsManager
            contacts={contacts}
            setContacts={setContacts}
            selectedDialCode={selectedDialCode}
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
        <div
          style={styles.exampleOverlay}
          onClick={() => setExampleToastDismissed(true)}
        >
          <div style={styles.exampleToast}>
            <span style={styles.exampleToastTitle}>Example data</span>
            <span style={styles.exampleToastText}>
              These contacts and templates are here to demo the tool. Scan data
              or open a transfer link to load your real setup.
            </span>
            <span className="example-data-toast-progress" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Bottom navbar */}
      <nav style={styles.navBar} className="glass-card">
        <button
          onClick={() => changeView("deck")}
          data-tour-target="mobile-phonebank-tab"
          style={{
            ...styles.navBtn,
            ...(view === "deck" ? styles.navBtnActive : {}),
          }}
        >
          <PhoneCall size={19} /> Phonebank
        </button>
        <button
          onClick={() => changeView("contacts")}
          data-tour-target="mobile-contacts-tab"
          style={{
            ...styles.navBtn,
            ...(view === "contacts" ? styles.navBtnActive : {}),
          }}
        >
          <Users size={19} /> Contacts
        </button>
        <button
          onClick={() => changeView("templates")}
          data-tour-target="mobile-setup-tab"
          style={{
            ...styles.navBtn,
            ...(view === "templates" ? styles.navBtnActive : {}),
          }}
        >
          <FileText size={20} /> Set up
        </button>
        <button
          onClick={() => changeView("scan")}
          data-tour-target="mobile-scan-tab"
          style={{
            ...styles.navBtn,
            ...(view === "scan" ? styles.navBtnActive : {}),
          }}
        >
          <QrCode size={20} /> Scan data
        </button>
      </nav>
      {isTourOpen && (
        <ProductTour
          currentStep={tourStep}
          steps={mobileProductTourSteps}
          spotlightSelector={`[data-tour-target="${mobileProductTourSteps[tourStep]?.highlightTarget}"]`}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onClose={closeTour}
          layout="mobile"
        />
      )}
      {exitConfirmOpen && (
        <div style={styles.exitOverlay} role="presentation">
          <div
            style={styles.exitModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-exit-title"
          >
            <span style={styles.exitKicker}>Leaving REACHOUT?</span>
            <h3 id="mobile-exit-title" style={styles.exitTitle}>
              Are you sure you're finished?
            </h3>
            <p style={styles.exitText}>
              If you close this tab, you may lose where you were in this
              phonebank.
            </p>
            <div style={styles.exitActions}>
              <button type="button" onClick={stayInApp} style={styles.exitStay}>
                Stay here
              </button>
              <button
                type="button"
                onClick={confirmExit}
                style={styles.exitLeave}
              >
                <LogOut size={15} />
                I'm finished
              </button>
            </div>
          </div>
        </div>
      )}
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  tourButton: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "transparent",
    color: "var(--ta-muted-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
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
    gap: "2px",
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
  exampleOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
    backdropFilter: "blur(1px)",
  },
  exitOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2200,
    padding: "18px",
    backdropFilter: "blur(1px)",
  },
  exitModal: {
    width: "min(340px, 100%)",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.42)",
    borderRadius: "12px",
    boxShadow: "var(--modal-card-shadow)",
    color: "var(--ta-cream)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  exitKicker: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-green)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  exitTitle: {
    color: "var(--ta-cream)",
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: 0,
  },
  exitText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
    margin: 0,
  },
  exitActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "9px",
    marginTop: "8px",
  },
  exitStay: {
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  exitLeave: {
    border: "1px solid var(--ta-green)",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    display: "flex",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    cursor: "pointer",
    minWidth: 0,
    padding: "4px 2px",
    lineHeight: 1.1,
  },
  navBtnActive: {
    color: "var(--ta-green)",
  },
};
