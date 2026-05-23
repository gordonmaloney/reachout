import { useCallback, useEffect, useState } from "react";
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
import { initialContacts, initialTemplates } from "./data/mockData";
import { organiserTourSteps, productTourSteps } from "./data/productTourSteps";
import {
  hasTransferLink,
  readEncryptedTransferLink,
} from "./linkTransferUtils";
import MobileWorkspace from "./components/MobileWorkspace";
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
  { id: "pickedUp", label: "Did they pick up?", type: "yes_no" },
  { id: "notes", label: "Notes", type: "text" },
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
  phone: "+44 7700 900123",
  mandatory: false,
  questions: defaultReportBackQuestions,
};

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
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
  const isOrganiserRoute = routePath === "/organiser";
  const isReportbackRoute = routePath === "/reportback";
  const [organiserModeEnabled, setOrganiserModeEnabled] =
    useState(isOrganiserRoute);
  const isOrganiser = isOrganiserRoute || organiserModeEnabled;
  const totalStages = isOrganiser ? 4 : 3;
  const finalStage = totalStages;
  const tourSteps = isOrganiser ? organiserTourSteps : productTourSteps;
  const [activeStage, setActiveStage] = useState(1);
  const [contacts, setContacts] = useState(initialContacts);
  const [templates, setTemplates] = useState(initialTemplates);
  const [callNotes, setCallNotes] = useState([]);
  const [reportBackSettings, setReportBackSettings] = useState({
    enabled: false,
    phone: "",
    mandatory: false,
    questions: defaultReportBackQuestions,
  });
  const [selectedDialCode, setSelectedDialCode] = useState("+44");
  const [extraChannelsEnabled, setExtraChannelsEnabled] = useState(false);
  const [hostSessionEnabled, setHostSessionEnabled] = useState(false);
  const [hostSessionCallers, setHostSessionCallers] = useState(2);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOrganiserInfoOpen, setIsOrganiserInfoOpen] = useState(false);
  const [isReportbackNumberModalOpen, setIsReportbackNumberModalOpen] =
    useState(false);
  const [reportbackPhoneFocusToken, setReportbackPhoneFocusToken] = useState(0);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [transferLoaded, setTransferLoaded] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [fontScale, setFontScale] = useState(getInitialFontScale);

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
    if (targetStage === activeStage) return;
    if (!verifyCanLeaveStage(targetStage)) return;
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
      mediaQuery = window.matchMedia?.("(prefers-color-scheme: light)");
    } catch {
      mediaQuery = window.matchMedia?.("(prefers-color-scheme: light)");
    }

    if (!mediaQuery) return undefined;

    const handleSystemThemeChange = (event) => {
      try {
        if (window.localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {
        // Keep following the device theme if storage is unavailable.
      }
      setTheme(event.matches ? "light" : "dark");
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
    if (transferLoaded || !hasTransferLink()) return;

    let cancelled = false;

    async function importTransferLink() {
      try {
        const imported = await readEncryptedTransferLink();
        if (cancelled || !imported) return;

        setContacts(imported.contacts || []);
        setTemplates(imported.templates || []);
        setCallNotes(imported.callNotes || []);
        setReportBackSettings({
          enabled: false,
          phone: "",
          mandatory: false,
          questions: defaultReportBackQuestions,
          ...(imported.reportBackSettings || {}),
        });
        setSelectedDialCode(imported.selectedDialCode || "+44");
        setExtraChannelsEnabled(Boolean(imported.extraChannelsEnabled));
        setActiveStage(finalStage);
        setTransferLoaded(true);
      } catch {
        setTransferLoaded(true);
      }
    }

    importTransferLink();

    return () => {
      cancelled = true;
    };
  }, [finalStage, transferLoaded]);

  useEffect(() => {
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
  }, [getTourStage, isMobile]);

  if (isMobile) {
    const shouldOpenScanner =
      new URLSearchParams(window.location.search).get("scan") === "1" ||
      new URLSearchParams(window.location.search).has("data");
    const shouldUseReportbackDemo = isReportbackRoute && !hasTransferLink();
    const mobileCallNotes =
      shouldUseReportbackDemo && callNotes.length === 0
        ? reportbackRouteCallNotes
        : callNotes;
    const mobileReportBackSettings =
      shouldUseReportbackDemo && !reportBackSettings.enabled
        ? reportbackRouteSettings
        : reportBackSettings;

    return (
      <MobileWorkspace
        contacts={contacts}
        setContacts={setContacts}
        templates={templates}
        setTemplates={setTemplates}
        callNotes={mobileCallNotes}
        setCallNotes={setCallNotes}
        reportBackSettings={mobileReportBackSettings}
        setReportBackSettings={setReportBackSettings}
        selectedDialCode={selectedDialCode}
        setSelectedDialCode={setSelectedDialCode}
        extraChannelsEnabled={extraChannelsEnabled}
        setExtraChannelsEnabled={setExtraChannelsEnabled}
        initialView={shouldOpenScanner ? "scan" : "deck"}
        theme={theme}
        onToggleTheme={toggleTheme}
        fontScale={fontScale}
      />
    );
  }


  return (
    <div
      className="app-container"
      data-theme={theme}
      style={{ "--reachout-text-scale": fontScale }}
    >
      {/* Top Brand Header */}
      <Header onStartTour={openProductTour} />

      {/* Main Layout Grid */}
      <main className="main-content">
        {/* Left Sidebar: Journey Nav */}
        <aside className="sidebar-panel">
          <JourneyNav
            activeStage={activeStage}
            setActiveStage={goToStage}
            onToggleHelp={toggleHelp}
            isOrganiser={isOrganiser}
            canToggleOrganiser={!isOrganiserRoute}
            organiserModeEnabled={isOrganiser}
            onToggleOrganiser={handleOrganiserModeToggle}
            onOpenOrganiserInfo={() => setIsOrganiserInfoOpen(true)}
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
        <section className="workspace-panel">
          {activeStage === 1 && (
            <ContactsStage
              contacts={contacts}
              setContacts={setContacts}
              selectedDialCode={selectedDialCode}
              setSelectedDialCode={setSelectedDialCode}
              stageNumLabel={`Stage 1 of ${totalStages}`}
              onNext={handleNextStage}
            />
          )}

          {activeStage === 2 && (
            <MessagesStage
              templates={templates}
              setTemplates={setTemplates}
              stageNumLabel={`Stage 2 of ${totalStages}`}
              nextLabel={
                isOrganiser ? "Add notes & reportbacks" : "Start messaging"
              }
              onPrev={handlePrevStage}
              onNext={handleNextStage}
            />
          )}

          {isOrganiser && activeStage === 3 && (
            <CallNotesStage
              callNotes={callNotes}
              setCallNotes={setCallNotes}
              reportBackSettings={reportBackSettings}
              setReportBackSettings={setReportBackSettings}
              reportbackPhoneFocusToken={reportbackPhoneFocusToken}
              stageNumLabel="Stage 3 of 4"
              onPrev={handlePrevStage}
              onNext={handleNextStage}
            />
          )}

          {activeStage === finalStage && (
            <ReviewLinksStage
              contacts={contacts}
              templates={templates}
              callNotes={callNotes}
              reportBackSettings={reportBackSettings}
              selectedDialCode={selectedDialCode}
              extraChannelsEnabled={extraChannelsEnabled}
              setExtraChannelsEnabled={setExtraChannelsEnabled}
              hostSessionEnabled={hostSessionEnabled}
              setHostSessionEnabled={setHostSessionEnabled}
              hostSessionCallers={hostSessionCallers}
              setHostSessionCallers={setHostSessionCallers}
              isOrganiser={isOrganiser}
              stageNumLabel={`Stage ${finalStage} of ${totalStages}`}
              backLabel={
                isOrganiser ? "Back to notes & reportbacks" : "Back to messages"
              }
              onPrev={handlePrevStage}
              onRestart={() => setActiveStage(1)}
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
    </div>
  );
}
