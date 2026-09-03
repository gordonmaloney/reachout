import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import JourneyNav from "./components/JourneyNav";
import ContactsStage from "./components/ContactsStage";
import MessagesStage from "./components/MessagesStage";
import CallNotesStage from "./components/CallNotesStage";
import ReviewLinksStage from "./components/ReviewLinksStage";
import HelpDrawer from "./components/HelpDrawer";
import OrganiserModeModal from "./components/OrganiserModeModal";
import ReportbackNumberModal from "./components/ReportbackNumberModal";
import ProductTour from "./components/ProductTour";
import FaqPage from "./components/FaqPage";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ReleaseNotesPage from "./components/ReleaseNotesPage";
import DemoContactModal from "./components/DemoContactModal";
import TransferLinkStatus from "./components/TransferLinkStatus";
import { initialContacts, initialTemplates } from "./data/mockData";
import { organiserTourSteps, productTourSteps } from "./data/productTourSteps";
import {
  hasTransferLink,
  isContactImportTransferLink,
  isPasswordProtectedTransferLink,
  readEncryptedTransferLink,
  removeTransferParamsFromHash,
} from "./linkTransferUtils";
import MobileWorkspace from "./components/MobileWorkspace";
import { applyMetadata, getMetadataForPath } from "./metadata";
const TOUR_STORAGE_KEY = "reachout.productTourSeen";
const THEME_STORAGE_KEY = "reachout.theme";
const FONT_SCALE_STORAGE_KEY = "reachout.fontScale";
const FONT_SCALE_DEFAULT_VERSION_KEY = "reachout.fontScaleDefaultVersion";
const FONT_SCALE_DEFAULT_VERSION = "2";
const FONT_SCALE_MIN = 0.95;
const FONT_SCALE_MAX = 1.16;
const FONT_SCALE_STEP = 0.07;
const DESKTOP_DEFAULT_FONT_SCALE = 1 + FONT_SCALE_STEP;
const defaultReportBackQuestions = [
  { id: "pickedUp", label: "Did they pick up?", type: "yes_no", mandatory: true },
  { id: "notes", label: "Notes", type: "text", mandatory: false },
];
const reportbackRouteCallNotes = [
  {
    id: "route_note_1",
    text: "Remind them about the branch meeting next Thursday.",
  },
  {
    id: "route_note_2",
    text: "Ask whether they have any current rent or repairs issues.",
  },
  {
    id: "route_note_3",
    text: "Check if they would be up for taking one small action this week.",
  },
];
const reportbackRouteSettings = {
  enabled: true,
  dialCode: "+44",
  phone: "+44 7700 900123",
  mandatory: false,
  questions: defaultReportBackQuestions,
};

function getSystemTheme() {
  try {
    if (!window.matchMedia) return "light";
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  } catch {
    return "light";
  }
}

function getInitialTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || getSystemTheme();
  } catch {
    return getSystemTheme();
  }
}

function getDefaultFontScale() {
  return window.innerWidth > 480 ? DESKTOP_DEFAULT_FONT_SCALE : 1;
}

function clampFontScale(scale) {
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
}

function getInitialFontScale() {
  const defaultScale = getDefaultFontScale();

  try {
    const storedValue = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    const storedDefaultVersion = window.localStorage.getItem(
      FONT_SCALE_DEFAULT_VERSION_KEY
    );
    const storedScale = Number(storedValue);

    if (!Number.isFinite(storedScale)) {
      return defaultScale;
    }

    if (
      window.innerWidth > 480 &&
      storedDefaultVersion !== FONT_SCALE_DEFAULT_VERSION &&
      storedScale <= 1
    ) {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(defaultScale));
      window.localStorage.setItem(
        FONT_SCALE_DEFAULT_VERSION_KEY,
        FONT_SCALE_DEFAULT_VERSION
      );
      return defaultScale;
    }

    return clampFontScale(storedScale);
  } catch {
    return defaultScale;
  }
}

export default function App() {
  const routePath = window.location.pathname.replace(/\/+$/, "");
  const isFaqRoute = routePath === "/faq";
  const isPrivacyRoute = routePath === "/privacy";
  const isReleaseNotesRoute = routePath === "/release-notes";
  const isOrganiserRoute = routePath === "/organiser";
  const isReportbackRoute = routePath === "/reportback";
  const isShareRoute = routePath === "/s";
  const initialTransferHash = window.location.hash;
  const expectsInitialTransfer =
    isShareRoute || hasTransferLink(initialTransferHash);
  const [organiserModeEnabled, setOrganiserModeEnabled] =
    useState(isOrganiserRoute);
  const isOrganiser = isOrganiserRoute || organiserModeEnabled;
  const totalStages = isOrganiser ? 4 : 3;
  const finalStage = totalStages;
  const tourSteps = isOrganiser ? organiserTourSteps : productTourSteps;
  const [activeStage, setActiveStage] = useState(1);
  const [contacts, setContacts] = useState(
    expectsInitialTransfer ? [] : initialContacts
  );
  const [templates, setTemplates] = useState(
    expectsInitialTransfer ? [] : initialTemplates
  );
  const [callNotes, setCallNotes] = useState([]);
  const [callNotesEnabled, setCallNotesEnabled] = useState(false);
  const [reportBackSettings, setReportBackSettings] = useState({
    enabled: false,
    dialCode: "+44",
    phone: "",
    mandatory: false,
    questions: defaultReportBackQuestions,
  });
  const [selectedDialCode, setSelectedDialCode] = useState("+44");
  const [extraChannelsEnabled, setExtraChannelsEnabled] = useState(false);
  const [callerNameTokenEnabled, setCallerNameTokenEnabled] = useState(false);
  const [hostSessionEnabled, setHostSessionEnabled] = useState(false);
  const [hostSessionCallers, setHostSessionCallers] = useState(2);
  const [linkPasswordProtected, setLinkPasswordProtected] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(isFaqRoute);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(isPrivacyRoute);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] =
    useState(isReleaseNotesRoute);
  const [isOrganiserInfoOpen, setIsOrganiserInfoOpen] = useState(false);
  const [isReportbackNumberModalOpen, setIsReportbackNumberModalOpen] =
    useState(false);
  const [reportbackPhoneFocusToken, setReportbackPhoneFocusToken] = useState(0);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDemoContactModalOpen, setIsDemoContactModalOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [transferLinkHash, setTransferLinkHash] = useState(
    initialTransferHash
  );
  const [transferStatus, setTransferStatus] = useState(() => {
    if (hasTransferLink(initialTransferHash)) return "loading";
    if (isShareRoute) return "invalid";
    return "idle";
  });
  const [importedTransferHash, setImportedTransferHash] = useState("");
  const [contactsImportRequest, setContactsImportRequest] = useState(0);
  const [transferPassword, setTransferPassword] = useState("");
  const [transferPasswordPrompt, setTransferPasswordPrompt] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [fontScale, setFontScale] = useState(getInitialFontScale);
  const workspacePanelRef = useRef(null);

  const verifyCanLeaveStage = (targetStage) => {
    const leavingReportbackStage =
      isOrganiser &&
      activeStage === 3 &&
      targetStage !== 3 &&
      reportBackSettings.enabled &&
      !reportBackSettings.phone.trim();

    if (!leavingReportbackStage) return true;

    setIsReportbackNumberModalOpen(true);
    return false;
  };

  const goToStage = (targetStage) => {
    if (targetStage === activeStage && !isFaqOpen && !isPrivacyOpen) return;
    if (!verifyCanLeaveStage(targetStage)) return;
    if (isFaqOpen || isPrivacyOpen) clearContentPath();
    setIsFaqOpen(false);
    setIsPrivacyOpen(false);
    setActiveStage(targetStage);
  };

  const handleNextStage = () => {
    if (activeStage < totalStages) goToStage(activeStage + 1);
  };

  const handlePrevStage = () => {
    if (activeStage > 1) goToStage(activeStage - 1);
  };

  const toggleHelp = () => {
    setIsHelpOpen((prev) => !prev);
  };

  const openFaq = () => {
    setIsFaqOpen(true);
    setIsPrivacyOpen(false);
    setIsReleaseNotesOpen(false);
    setIsTourOpen(false);
  };

  const openPrivacy = () => {
    setIsPrivacyOpen(true);
    setIsFaqOpen(false);
    setIsReleaseNotesOpen(false);
    setIsTourOpen(false);
  };

  const openReleaseNotes = () => {
    setIsReleaseNotesOpen(true);
    setIsFaqOpen(false);
    setIsPrivacyOpen(false);
    setIsTourOpen(false);
  };

  const clearContentPath = () => {
    if (
      window.location.pathname === "/faq" ||
      window.location.pathname === "/privacy" ||
      window.location.pathname === "/release-notes"
    ) {
      window.history.replaceState({}, "", "/");
    }
  };

  const closeFaqToContacts = () => {
    clearContentPath();
    setIsFaqOpen(false);
    setIsPrivacyOpen(false);
    setIsReleaseNotesOpen(false);
    setActiveStage(1);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Theme still changes for this render if storage is unavailable.
      }
      return nextTheme;
    });
  };

  const updateFontScale = (direction) => {
    setFontScale((currentScale) => {
      const nextScale = Number(
        Math.min(
          FONT_SCALE_MAX,
          Math.max(FONT_SCALE_MIN, currentScale + direction * FONT_SCALE_STEP)
        ).toFixed(2)
      );

      try {
        window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(nextScale));
        window.localStorage.setItem(
          FONT_SCALE_DEFAULT_VERSION_KEY,
          FONT_SCALE_DEFAULT_VERSION
        );
      } catch {
        // Font scale still changes for this render if storage is unavailable.
      }

      return nextScale;
    });
  };

  const closeReportbackNumberModal = () => {
    setIsReportbackNumberModalOpen(false);
    setReportbackPhoneFocusToken((token) => token + 1);
  };

  const handleOrganiserModeToggle = () => {
    setOrganiserModeEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (nextEnabled) {
        setIsOrganiserInfoOpen(true);
      } else if (activeStage > 3) {
        setActiveStage(3);
      }
      if (!nextEnabled) {
        setHostSessionEnabled(false);
        setCallerNameTokenEnabled(false);
        setCallNotesEnabled(false);
      }
      return nextEnabled;
    });
  };

  const markTourSeen = () => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // Ignore storage failures; the tour still works for this session.
    }
  };

  const getTourStage = useCallback(
    (stepIndex) => {
      return tourSteps[stepIndex].stage;
    },
    [tourSteps]
  );

  const openProductTour = () => {
    setTourStep(0);
    goToStage(getTourStage(0));
    setIsTourOpen(true);
  };

  const closeProductTour = () => {
    markTourSeen();
    setIsTourOpen(false);
  };

  const finishProductTour = () => {
    if (!verifyCanLeaveStage(1)) return;
    closeProductTour();
    setActiveStage(1);
  };

  const goToTourStep = (nextStep) => {
    const targetStage = getTourStage(nextStep);
    if (!verifyCanLeaveStage(targetStage)) return;
    setTourStep(nextStep);
    setActiveStage(targetStage);
  };

  const handleTourNext = () => {
    if (tourStep >= tourSteps.length - 1) {
      finishProductTour();
      return;
    }

    goToTourStep(tourStep + 1);
  };

  const handleTourPrev = () => {
    if (tourStep === 0) return;
    goToTourStep(tourStep - 1);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mediaQuery;
    try {
      if (window.localStorage.getItem(THEME_STORAGE_KEY)) return undefined;
      mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    } catch {
      mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    }

    if (!mediaQuery) return undefined;

    const handleSystemThemeChange = (event) => {
      try {
        if (window.localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        // Keep following the device theme if storage is unavailable.
      }
      setTheme(event.matches ? "dark" : "light");
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener?.(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener?.(handleSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    const updateTransferHash = () => {
      const nextHash = window.location.hash;
      setTransferLinkHash(nextHash);
      if (hasTransferLink(nextHash)) {
        setTransferStatus("loading");
      } else if (isShareRoute) {
        setTransferStatus((current) =>
          current === "ready" ? current : "invalid"
        );
      }
    };

    window.addEventListener("hashchange", updateTransferHash);
    window.addEventListener("popstate", updateTransferHash);

    return () => {
      window.removeEventListener("hashchange", updateTransferHash);
      window.removeEventListener("popstate", updateTransferHash);
    };
  }, [isShareRoute]);

  useEffect(() => {
    applyMetadata(getMetadataForPath(routePath));
  }, [routePath]);

  useEffect(() => {
    if (!hasTransferLink(transferLinkHash)) return;
    if (importedTransferHash === transferLinkHash) return;
    if (
      isPasswordProtectedTransferLink(transferLinkHash) &&
      !transferPassword
    ) {
      if (transferPasswordPrompt?.hash !== transferLinkHash) {
        setTransferStatus("password-required");
        setTransferPasswordPrompt({
          hash: transferLinkHash,
          value: "",
          error: "",
        });
      }
      return;
    }

    let cancelled = false;

    async function importTransferLink() {
      const shouldOpenContactsImport =
        isContactImportTransferLink(transferLinkHash);

      const clearProcessedTransferParams = () => {
        const nextHash = removeTransferParamsFromHash(transferLinkHash);
        const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
        window.history.replaceState(window.history.state, "", nextUrl);
        setTransferLinkHash(nextHash);
      };

      try {
        const imported = await readEncryptedTransferLink(transferLinkHash, {
          password: transferPassword,
        });
        if (cancelled || !imported) return;

        setContacts(imported.contacts || []);
        setTemplates(shouldOpenContactsImport ? [] : imported.templates || []);
        setCallNotes(imported.callNotes || []);
        setCallNotesEnabled(
          Boolean(imported.callNotesEnabled ?? imported.callNotes?.length)
        );
        setReportBackSettings({
          enabled: false,
          dialCode: "+44",
          phone: "",
          mandatory: false,
          questions: defaultReportBackQuestions,
          ...(imported.reportBackSettings || {}),
        });
        setSelectedDialCode(imported.selectedDialCode || "+44");
        setExtraChannelsEnabled(Boolean(imported.extraChannelsEnabled));
        setCallerNameTokenEnabled(Boolean(imported.callerNameTokenEnabled));
        if (shouldOpenContactsImport) {
          setActiveStage(1);
          setContactsImportRequest((request) => request + 1);
        } else {
          setActiveStage(finalStage);
        }
        setImportedTransferHash(transferLinkHash);
        setTransferStatus("ready");
        setTransferPasswordPrompt(null);
        setTransferPassword("");
        clearProcessedTransferParams();
      } catch (error) {
        if (error?.code === "PASSWORD_REQUIRED" || error?.code === "PASSWORD_INCORRECT") {
          setTransferPassword("");
          setTransferStatus("password-required");
          setTransferPasswordPrompt({
            hash: transferLinkHash,
            value: "",
            error:
              error.code === "PASSWORD_INCORRECT"
                ? "That password did not unlock this link."
                : "",
          });
          return;
        }
        setImportedTransferHash(transferLinkHash);
        setTransferStatus("invalid");
      }
    }

    importTransferLink();

    return () => {
      cancelled = true;
    };
  }, [
    finalStage,
    importedTransferHash,
    transferLinkHash,
    transferPassword,
    transferPasswordPrompt?.hash,
  ]);

  useEffect(() => {
    if (isFaqOpen || isPrivacyOpen || isReleaseNotesOpen) return;
    if (isMobile) return;
    if (hasTransferLink()) return;

    try {
      if (window.localStorage.getItem(TOUR_STORAGE_KEY) === "true") return;
    } catch {
      // If storage is unavailable, show the tour once for this render.
    }

    window.setTimeout(() => {
      setIsTourOpen(true);
      setActiveStage(getTourStage(0));
    }, 0);
  }, [getTourStage, isFaqOpen, isMobile, isPrivacyOpen, isReleaseNotesOpen]);

  useEffect(() => {
    if (isMobile) return;
    workspacePanelRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeStage, isMobile]);

  const submitTransferPassword = (event) => {
    event.preventDefault();
    const password = transferPasswordPrompt?.value?.trim() || "";
    if (!password) {
      setTransferPasswordPrompt((current) => ({
        ...current,
        error: "Enter the password for this link.",
      }));
      return;
    }
    setTransferPassword(password);
  };

  const passwordPrompt = transferPasswordPrompt && (
    <TransferPasswordModal
      value={transferPasswordPrompt.value}
      error={transferPasswordPrompt.error}
      theme={theme}
      fontScale={fontScale}
      onChange={(value) =>
        setTransferPasswordPrompt((current) => ({
          ...current,
          value,
          error: "",
        }))
      }
      onSubmit={submitTransferPassword}
    />
  );

  if (transferStatus === "invalid") {
    return (
      <TransferLinkStatus
        status="invalid"
        theme={theme}
        fontScale={fontScale}
      />
    );
  }

  if (
    transferStatus === "loading" ||
    transferStatus === "password-required"
  ) {
    return (
      <>
        <TransferLinkStatus
          status="loading"
          theme={theme}
          fontScale={fontScale}
        />
        {passwordPrompt}
      </>
    );
  }

  if (isMobile) {
    const shouldOpenScanner =
      new URLSearchParams(window.location.search).get("scan") === "1" ||
      new URLSearchParams(window.location.search).has("data");
    const shouldUseReportbackDemo = isReportbackRoute && !hasTransferLink();
    const mobileCallNotes =
      shouldUseReportbackDemo && callNotes.length === 0
        ? reportbackRouteCallNotes
        : callNotesEnabled
          ? callNotes
          : [];
    const mobileReportBackSettings =
      shouldUseReportbackDemo && !reportBackSettings.enabled
        ? reportbackRouteSettings
        : reportBackSettings;

    return (
      <>
        <MobileWorkspace
          key={`mobile-workspace-${contactsImportRequest}`}
          contacts={contacts}
          setContacts={setContacts}
          templates={templates}
          setTemplates={setTemplates}
          callNotes={mobileCallNotes}
          setCallNotes={setCallNotes}
          setCallNotesEnabled={setCallNotesEnabled}
          reportBackSettings={mobileReportBackSettings}
          setReportBackSettings={setReportBackSettings}
          selectedDialCode={selectedDialCode}
          setSelectedDialCode={setSelectedDialCode}
          extraChannelsEnabled={extraChannelsEnabled}
          setExtraChannelsEnabled={setExtraChannelsEnabled}
          callerNameTokenEnabled={callerNameTokenEnabled}
          setCallerNameTokenEnabled={setCallerNameTokenEnabled}
          initialView={
            contactsImportRequest
              ? "contacts"
              : isFaqOpen
              ? "faq"
              : isPrivacyOpen
                ? "privacy"
                : isReleaseNotesOpen
                  ? "releaseNotes"
                  : shouldOpenScanner
                    ? "scan"
                    : "deck"
          }
          onCloseFaq={closeFaqToContacts}
          theme={theme}
          onToggleTheme={toggleTheme}
          fontScale={fontScale}
          onDemoContactAction={() => setIsDemoContactModalOpen(true)}
        />
        <DemoContactModal
          isOpen={isDemoContactModalOpen}
          onClose={() => setIsDemoContactModalOpen(false)}
          theme={theme}
          fontScale={fontScale}
        />
        {passwordPrompt}
      </>
    );
  }


  return (
    <div
      className="app-container"
      data-theme={theme}
      style={{ "--reachout-text-scale": fontScale }}
    >
      {/* Top Brand Header */}
      <Header onStartTour={openProductTour} onOpenFaq={openFaq} />

      {/* Main Layout Grid */}
      <main className="main-content">
        {/* Left Sidebar: Journey Nav */}
        <aside className="sidebar-panel">
          <JourneyNav
            activeStage={
              isFaqOpen || isPrivacyOpen || isReleaseNotesOpen
                ? null
                : activeStage
            }
            setActiveStage={goToStage}
            onToggleHelp={toggleHelp}
            isOrganiser={isOrganiser}
            canToggleOrganiser={!isOrganiserRoute}
            organiserModeEnabled={isOrganiser}
            onToggleOrganiser={handleOrganiserModeToggle}
            onOpenOrganiserInfo={() => setIsOrganiserInfoOpen(true)}
            onOpenReleaseNotes={openReleaseNotes}
            theme={theme}
            onToggleTheme={toggleTheme}
            fontScale={fontScale}
            canDecreaseFontScale={fontScale > FONT_SCALE_MIN}
            canIncreaseFontScale={fontScale < FONT_SCALE_MAX}
            onDecreaseFontScale={() => updateFontScale(-1)}
            onIncreaseFontScale={() => updateFontScale(1)}
            tourHighlightStage={
              isTourOpen && !tourSteps[tourStep]?.highlightTarget
                ? tourSteps[tourStep]?.stage
                : null
            }
            tourHighlightTarget={
              isTourOpen ? tourSteps[tourStep]?.highlightTarget : null
            }
          />
        </aside>

        {/* Center/Right Workspace Area */}
        <section ref={workspacePanelRef} className="workspace-panel">
          {isFaqOpen ? (
            <FaqPage onBack={closeFaqToContacts} />
          ) : isPrivacyOpen ? (
            <PrivacyPolicy onBack={closeFaqToContacts} />
          ) : isReleaseNotesOpen ? (
            <ReleaseNotesPage onBack={closeFaqToContacts} />
          ) : activeStage === 1 ? (
            <ContactsStage
              contacts={contacts}
              setContacts={setContacts}
              selectedDialCode={selectedDialCode}
              setSelectedDialCode={setSelectedDialCode}
              stageNumLabel={`Stage 1 of ${totalStages}`}
              onNext={handleNextStage}
              onOpenPrivacy={openPrivacy}
            />
          ) : null}

          {!isFaqOpen && !isPrivacyOpen && !isReleaseNotesOpen && activeStage === 2 && (
            <MessagesStage
              templates={templates}
              setTemplates={setTemplates}
              stageNumLabel={`Stage 2 of ${totalStages}`}
              nextLabel={
                isOrganiser ? "Organiser settings" : "Start messaging"
              }
              callerNameTokenEnabled={isOrganiser && callerNameTokenEnabled}
              canUseCallerNameToken={isOrganiser}
              setCallerNameTokenEnabled={setCallerNameTokenEnabled}
              onPrev={handlePrevStage}
              onNext={handleNextStage}
            />
          )}

          {!isFaqOpen && !isPrivacyOpen && !isReleaseNotesOpen && isOrganiser && activeStage === 3 && (
            <CallNotesStage
              callNotes={callNotes}
              setCallNotes={setCallNotes}
              callNotesEnabled={callNotesEnabled}
              setCallNotesEnabled={setCallNotesEnabled}
              reportBackSettings={reportBackSettings}
              setReportBackSettings={setReportBackSettings}
              linkPasswordProtected={linkPasswordProtected}
              setLinkPasswordProtected={setLinkPasswordProtected}
              linkPassword={linkPassword}
              setLinkPassword={setLinkPassword}
              callerNameTokenEnabled={callerNameTokenEnabled}
              setCallerNameTokenEnabled={setCallerNameTokenEnabled}
              reportbackPhoneFocusToken={reportbackPhoneFocusToken}
              stageNumLabel="Stage 3 of 4"
              onPrev={handlePrevStage}
              onNext={handleNextStage}
            />
          )}

          {!isFaqOpen && !isPrivacyOpen && !isReleaseNotesOpen && activeStage === finalStage && (
            <ReviewLinksStage
              contacts={contacts}
              templates={templates}
              callNotes={callNotesEnabled ? callNotes : []}
              callNotesEnabled={callNotesEnabled}
              reportBackSettings={reportBackSettings}
              selectedDialCode={selectedDialCode}
              extraChannelsEnabled={extraChannelsEnabled}
              setExtraChannelsEnabled={setExtraChannelsEnabled}
              callerNameTokenEnabled={isOrganiser && callerNameTokenEnabled}
              hostSessionEnabled={hostSessionEnabled}
              setHostSessionEnabled={setHostSessionEnabled}
              hostSessionCallers={hostSessionCallers}
              setHostSessionCallers={setHostSessionCallers}
              linkPasswordProtected={linkPasswordProtected}
              linkPassword={linkPassword}
              isOrganiser={isOrganiser}
              theme={theme}
              fontScale={fontScale}
              stageNumLabel={`Stage ${finalStage} of ${totalStages}`}
              backLabel={
                isOrganiser ? "Back to organiser settings" : "Back to messages"
              }
              onPrev={handlePrevStage}
              onRestart={() => setActiveStage(1)}
              onDemoContactAction={() => setIsDemoContactModalOpen(true)}
            />
          )}
        </section>
      </main>

      {/* Global help training guide overlay */}
      <HelpDrawer isOpen={isHelpOpen} onClose={toggleHelp} />
      {isOrganiserInfoOpen && (
        <OrganiserModeModal onClose={() => setIsOrganiserInfoOpen(false)} />
      )}
      {isReportbackNumberModalOpen && (
        <ReportbackNumberModal onClose={closeReportbackNumberModal} />
      )}
      {isTourOpen && (
        <ProductTour
          currentStep={tourStep}
          steps={tourSteps}
          spotlightSelector={
            tourSteps[tourStep]?.highlightTarget
              ? `[data-tour-target="${tourSteps[tourStep].highlightTarget}"]`
              : `[data-tour-target="stage-${tourSteps[tourStep]?.stage}"]`
          }
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onClose={closeProductTour}
        />
      )}
      <DemoContactModal
        isOpen={isDemoContactModalOpen}
        onClose={() => setIsDemoContactModalOpen(false)}
        theme={theme}
        fontScale={fontScale}
      />
      {passwordPrompt}
    </div>
  );
}

function TransferPasswordModal({
  value,
  error,
  theme,
  fontScale,
  onChange,
  onSubmit,
}) {
  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      backgroundColor: "var(--modal-overlay)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px",
    },
    modal: {
      width: "min(360px, 100%)",
      border: "1px solid rgba(79, 159, 104, 0.3)",
      borderRadius: "14px",
      backgroundColor: "var(--modal-card-bg)",
      color: "var(--ta-cream)",
      boxShadow: "var(--modal-card-shadow)",
      padding: "18px",
    },
    kicker: {
      color: "var(--ta-green)",
      fontFamily: "var(--font-mono)",
      fontSize: "calc(10px * var(--reachout-text-scale, 1))",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    title: {
      margin: "6px 0 8px",
      color: "var(--ta-cream)",
      fontSize: "calc(22px * var(--reachout-text-scale, 1))",
      lineHeight: 1.05,
    },
    text: {
      margin: 0,
      color: "var(--ta-muted-strong)",
      fontSize: "calc(13px * var(--reachout-text-scale, 1))",
      lineHeight: 1.4,
    },
    input: {
      width: "100%",
      border: "1px solid var(--ta-border-subtle)",
      borderRadius: "8px",
      backgroundColor: "var(--surface-subtle)",
      color: "var(--ta-cream)",
      padding: "10px",
      marginTop: "14px",
      fontFamily: "var(--font-body)",
      fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    },
    error: {
      margin: "8px 0 0",
      color: "var(--ta-red)",
      fontSize: "calc(12px * var(--reachout-text-scale, 1))",
      fontWeight: 700,
    },
    button: {
      width: "100%",
      marginTop: "14px",
      border: "1px solid var(--ta-green)",
      borderRadius: "999px",
      backgroundColor: "var(--ta-green)",
      color: "var(--ta-dark)",
      padding: "10px 14px",
      fontFamily: "var(--font-body)",
      fontSize: "calc(13px * var(--reachout-text-scale, 1))",
      fontWeight: 800,
    },
  };

  return (
    <div
      className="mobile-workspace"
      data-theme={theme}
      style={{ ...styles.overlay, "--reachout-text-scale": fontScale }}
      role="presentation"
    >
      <form
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-password-title"
        autoComplete="off"
        onSubmit={onSubmit}
      >
        <span style={styles.kicker}>Encrypted link</span>
        <h3 id="transfer-password-title" style={styles.title}>
          Enter the password
        </h3>
        <p style={styles.text}>
          This REACHOUT phonebank was password protected by the organiser. Enter
          the password they shared with you to unlock it.
        </p>
        <input
          type="password"
          name="reachout-transfer-unlock-key"
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Password"
          style={styles.input}
          autoFocus
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button}>
          Unlock phonebank
        </button>
      </form>
    </div>
  );
}
