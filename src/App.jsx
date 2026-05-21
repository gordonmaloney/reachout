import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import JourneyNav from './components/JourneyNav';
import ContactsStage from './components/ContactsStage';
import MessagesStage from './components/MessagesStage';
import CallNotesStage from './components/CallNotesStage';
import ReviewLinksStage from './components/ReviewLinksStage';
import HelpDrawer from './components/HelpDrawer';
import OrganiserModeModal from './components/OrganiserModeModal';
import ProductTour from './components/ProductTour';
import { initialContacts, initialTemplates } from './data/mockData';
import { organiserTourSteps, productTourSteps } from './data/productTourSteps';
import { hasTransferLink, readEncryptedTransferLink } from './linkTransferUtils';
import MobileWorkspace from './components/MobileWorkspace';
const TOUR_STORAGE_KEY = 'reachout.productTourSeen';
const defaultReportBackQuestions = [
  { id: 'pickedUp', label: 'Did they pick up?', type: 'yes_no' },
  { id: 'notes', label: 'Notes', type: 'text' },
];

export default function App() {
  const isOrganiserRoute = window.location.pathname.replace(/\/+$/, '') === '/organiser';
  const [organiserModeEnabled, setOrganiserModeEnabled] = useState(isOrganiserRoute);
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
    phone: '',
    questions: defaultReportBackQuestions,
  });
  const [selectedDialCode, setSelectedDialCode] = useState('+44');
  const [extraChannelsEnabled, setExtraChannelsEnabled] = useState(false);
  const [hostSessionEnabled, setHostSessionEnabled] = useState(false);
  const [hostSessionCallers, setHostSessionCallers] = useState(2);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isOrganiserInfoOpen, setIsOrganiserInfoOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [transferLoaded, setTransferLoaded] = useState(false);

  const handleNextStage = () => {
    if (activeStage < totalStages) {
      setActiveStage(activeStage + 1);
    }
  };

  const handlePrevStage = () => {
    if (activeStage > 1) {
      setActiveStage(activeStage - 1);
    }
  };

  const toggleHelp = () => {
    setIsHelpOpen(prev => !prev);
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
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage failures; the tour still works for this session.
    }
  };

  const getTourStage = useCallback((stepIndex) => {
    return tourSteps[stepIndex].stage;
  }, [tourSteps]);

  const openProductTour = () => {
    setTourStep(0);
    setActiveStage(getTourStage(0));
    setIsTourOpen(true);
  };

  const closeProductTour = () => {
    markTourSeen();
    setIsTourOpen(false);
  };

  const finishProductTour = () => {
    closeProductTour();
    setActiveStage(1);
  };

  const goToTourStep = (nextStep) => {
    setTourStep(nextStep);
    setActiveStage(getTourStage(nextStep));
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
          phone: '',
          questions: defaultReportBackQuestions,
          ...(imported.reportBackSettings || {}),
        });
        setSelectedDialCode(imported.selectedDialCode || '+44');
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
      if (window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true') return;
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
      new URLSearchParams(window.location.search).get('scan') === '1' ||
      new URLSearchParams(window.location.search).has('data');

    return <MobileWorkspace contacts={contacts} setContacts={setContacts} templates={templates} setTemplates={setTemplates} callNotes={callNotes} setCallNotes={setCallNotes} reportBackSettings={reportBackSettings} setReportBackSettings={setReportBackSettings} selectedDialCode={selectedDialCode} setSelectedDialCode={setSelectedDialCode} extraChannelsEnabled={extraChannelsEnabled} setExtraChannelsEnabled={setExtraChannelsEnabled} initialView={shouldOpenScanner ? 'scan' : 'deck'} />;
  }
  return (
    <div className="app-container">
      {/* Top Brand Header */}
      <Header onStartTour={openProductTour} />

      {/* Main Layout Grid */}
      <main className="main-content">
        
        {/* Left Sidebar: Journey Nav */}
        <aside className="sidebar-panel">
          <JourneyNav 
            activeStage={activeStage} 
            setActiveStage={setActiveStage}
            onToggleHelp={toggleHelp}
            isOrganiser={isOrganiser}
            canToggleOrganiser={!isOrganiserRoute}
            organiserModeEnabled={isOrganiser}
            onToggleOrganiser={handleOrganiserModeToggle}
            onOpenOrganiserInfo={() => setIsOrganiserInfoOpen(true)}
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
            nextLabel={isOrganiser ? "ADD NOTES & REPORTBACKS" : "START MESSAGING"}
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
              backLabel={isOrganiser ? "Back to notes & reportbacks" : "Back to messages"}
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
      {isTourOpen && (
        <ProductTour
          currentStep={tourStep}
          steps={tourSteps}
          onNext={handleTourNext}
          onPrev={handleTourPrev}
          onClose={closeProductTour}
        />
      )}
    </div>
  );
}
