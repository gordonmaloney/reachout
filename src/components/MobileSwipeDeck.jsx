// MobileSwipeDeck – single-card animation using CSS @keyframes + onAnimationEnd
// Inspired by the SwipeExplainer pattern: phase-driven, no setTimeout for animation sync.
import { useEffect, useMemo, useRef, useState } from "react";
import MobileContactCard from "./MobileContactCard";
import MobileReportBackCard from "./MobileReportBackCard";
import { initialContacts } from "../data/mockData";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  Phone,
  FileText,
  MessageCircle,
  Send,
} from "lucide-react";
import ProductTour from "./ProductTour";
import { getOptOutPlainText, getOptOutRows } from "../reportTextUtils";
import { generateSmsHref } from "../utils";
import "./MobileSwipeDeck.css";

export default function MobileSwipeDeck({
  contacts,
  templates,
  selectedDialCode,
  extraChannelsEnabled,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  contactReports = {},
  setContactReports = () => {},
  onIndexChange = () => {},
  initialIndex = 0,
  onFirstTouch,
  onOpenFaq = () => {},
  onOpenPrivacy = () => {},
  deckResetToken = 0,
  cardTourRequestToken = 0,
  onCardTourClose = () => {},
  returnToWelcomeOnCardTourComplete = false,
  callerName = "",
}) {
  const itemCount = contacts.length + 2;
  const [index, setIndex] = useState(initialIndex);
  // phase: "idle" | "exit" | "enter"
  const [phase, setPhase] = useState("idle");
  // direction: 1 = next (exits left, enters from right), -1 = prev (exits right, enters from left)
  const [direction, setDirection] = useState(0);
  const [exitStartX, setExitStartX] = useState(0);
  // The contact data currently displayed on the card
  const [displayContact, setDisplayContact] = useState(
    contacts[Math.max(0, initialIndex - 1)]
  );
  // Pending index to commit after exit animation
  const pendingIndexRef = useRef(null);

  // Drag state for live finger-follow
  const startXRef = useRef(null);
  const startYRef = useRef(null);
  const startInScrollableCardRef = useRef(false);
  const gestureAxisRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [blockedQuestionIds, setBlockedQuestionIds] = useState([]);
  const [cardTourOpen, setCardTourOpen] = useState(false);
  const [cardTourStep, setCardTourStep] = useState(0);
  const [pendingCombinedCardTour, setPendingCombinedCardTour] = useState(false);
  const reportQuestions =
    reportBackSettings.questions?.filter((question) =>
      question.label?.trim()
    ) || [];
  const mandatoryReportQuestions = reportQuestions.filter((question) =>
    Boolean(question.mandatory)
  );
  const cardTourSteps = useMemo(
    () =>
      buildMobileCardTourSteps({
        hasContacts: contacts.length > 0,
        hasCallNotes: callNotes.some((note) => note.text?.trim()),
        extraChannelsEnabled,
        reportBackEnabled: Boolean(reportBackSettings.enabled),
        reportBackRequired: Boolean(reportBackSettings.mandatory),
      }),
    [
      callNotes,
      contacts.length,
      extraChannelsEnabled,
      reportBackSettings.enabled,
      reportBackSettings.mandatory,
    ]
  );

  const getMissingRequiredQuestionIds = () => {
    if (!reportBackSettings.enabled || !reportBackSettings.mandatory)
      return [];
    if (index === 0 || index > contacts.length) return [];
    if (mandatoryReportQuestions.length === 0) return [];

    const contact = contacts[index - 1];
    const report = contactReports[contact?.id];
    if (!report?.contacted) {
      return mandatoryReportQuestions.map((question) => question.id);
    }

    return mandatoryReportQuestions
      .filter((question) => {
      const answer = report.answers?.[question.id];
        return String(answer || "").trim().length === 0;
      })
      .map((question) => question.id);
  };

  const isCurrentReportComplete = () => {
    return getMissingRequiredQuestionIds().length === 0;
  };

  const showIndexImmediately = (nextIndex) => {
    setIndex(nextIndex);
    setPhase("idle");
    setDirection(0);
    pendingIndexRef.current = null;
    setDragX(0);
    setIsDragging(false);
    setDisplayContact(contacts[Math.max(0, nextIndex - 1)]);
    onIndexChange(nextIndex);
  };

  const openCardTour = () => {
    onFirstTouch?.();

    if (contacts.length > 0 && (index === 0 || index > contacts.length)) {
      showIndexImmediately(1);
    }

    setCardTourStep(0);
    setCardTourOpen(true);
  };

  const closeCardTour = ({ completed = false } = {}) => {
    setCardTourOpen(false);
    setCardTourStep(0);
    window.requestAnimationFrame(() => {
      document.querySelector(".mobile-card-scroll")?.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    });
    onCardTourClose({ completed });
    if (returnToWelcomeOnCardTourComplete && index > 0) {
      window.setTimeout(() => {
        triggerSwipe(-1);
      }, 80);
    }
  };

  const goToNextCardTourStep = () => {
    if (cardTourStep >= cardTourSteps.length - 1) {
      closeCardTour({ completed: true });
      return;
    }

    setCardTourStep((step) => step + 1);
  };

  const goToPreviousCardTourStep = () => {
    setCardTourStep((step) => Math.max(0, step - 1));
  };

  useEffect(() => {
    if (!deckResetToken) return;
    setPendingCombinedCardTour(false);
    setCardTourOpen(false);
    setCardTourStep(0);
    showIndexImmediately(0);
    document.querySelector(".mobile-card-scroll")?.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [deckResetToken]);

  useEffect(() => {
    if (!cardTourRequestToken || contacts.length === 0) return;

    setPendingCombinedCardTour(true);
    setCardTourStep(0);

    if (index !== 0) {
      showIndexImmediately(0);
    }
  }, [cardTourRequestToken]);

  useEffect(() => {
    if (!pendingCombinedCardTour || contacts.length === 0 || phase !== "idle") {
      return;
    }

    if (index === 1) {
      setPendingCombinedCardTour(false);
      openCardTour();
      return;
    }

    if (index !== 0) return;
    triggerSwipe(1);
  }, [contacts.length, index, pendingCombinedCardTour, phase]);

  // ── Gesture handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (phase !== "idle") return;
    const touch = e.touches ? e.touches[0] : e;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startInScrollableCardRef.current = Boolean(
      e.target.closest?.(".mobile-card-scroll")
    );
    gestureAxisRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    //close example modal on swipe begin
    initialIndex == 0 && onFirstTouch();

    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const AXIS_LOCK_THRESHOLD = 10;
    const HORIZONTAL_DOMINANCE = 1.35;

    if (
      !gestureAxisRef.current &&
      (absDx > AXIS_LOCK_THRESHOLD || absDy > AXIS_LOCK_THRESHOLD)
    ) {
      if (absDy > absDx * 1.1) {
        gestureAxisRef.current = "vertical";
      } else if (absDx > absDy * HORIZONTAL_DOMINANCE) {
        gestureAxisRef.current = "horizontal";
      }
    }

    if (gestureAxisRef.current === "vertical") {
      setDragX(0);
      return;
    }

    if (gestureAxisRef.current === "horizontal") {
      //only allow card swiping if there's one to swipe to
      const THRESHOLD = 14

      //right
      if (dx < -THRESHOLD) {
        if (index == contacts.length + 1) return;
      }
      //left
      else if (dx > THRESHOLD) {
        if (index == 0) return;
      }

      setDragX(dx);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    const THRESHOLD = 56;
    const HORIZONTAL_DOMINANCE = 1.35;

    if (Math.abs(dx) >= THRESHOLD || Math.abs(dy) >= THRESHOLD) {
      // Pick dominant axis
      if (
        gestureAxisRef.current === "horizontal" &&
        Math.abs(dx) > Math.abs(dy) * HORIZONTAL_DOMINANCE
      ) {
        // Horizontal: swipe left = next, swipe right = prev
        if (dx < -THRESHOLD) triggerSwipe(1, dx);
        else if (dx > THRESHOLD) triggerSwipe(-1, dx);
      } else if (
        !startInScrollableCardRef.current &&
        gestureAxisRef.current !== "horizontal" &&
        Math.abs(dy) > Math.abs(dx) * 1.2
      ) {
        // Vertical: swipe up = next, swipe down = prev
        if (dy < -THRESHOLD) triggerSwipe(1, dx);
        else if (dy > THRESHOLD) triggerSwipe(-1, dx);
      }
    }

    // Reset drag
    setDragX(0);
    setIsDragging(false);
    startXRef.current = null;
    startYRef.current = null;
    startInScrollableCardRef.current = false;
    gestureAxisRef.current = null;
  };

  // ── Trigger a swipe (dir: 1=next, -1=prev) ────────────────────────────
  const triggerSwipe = (dir, startX = 0) => {
    if (phase !== "idle") return false;
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= itemCount) return false;
    const missingQuestionIds = getMissingRequiredQuestionIds();
    if (dir > 0 && missingQuestionIds.length > 0) {
      setBlockMessage(
        "Complete the required reportback questions before moving to the next contact."
      );
      setBlockedQuestionIds(missingQuestionIds);
      window.setTimeout(() => {
        setBlockMessage("");
        setBlockedQuestionIds([]);
      }, 2200);
      return false;
    }

    setBlockMessage("");
    setBlockedQuestionIds([]);
    pendingIndexRef.current = newIdx;
    setExitStartX(startX);
    setDirection(dir);
    setPhase("exit"); // → starts CSS exit animation
    return true;
  };

  // ── Animation-end handler (the key to avoiding snap-back) ─────────────
  const handleAnimationEnd = () => {
    if (phase === "exit") {
      // Exit animation just finished — card is now off-screen & invisible.
      // Swap data while invisible, then start entry animation.
      const newIdx = pendingIndexRef.current;
      setIndex(newIdx);
      onIndexChange(newIdx);
      setDisplayContact(contacts[newIdx - 1] || contacts[0]);
      setPhase("enter"); // → starts CSS enter animation
    } else if (phase === "enter") {
      // Entry animation finished — card is centered & fully visible.
      setPhase("idle");
      setDirection(0);
      setExitStartX(0);
      if (pendingCombinedCardTour && pendingIndexRef.current === 1) {
        setPendingCombinedCardTour(false);
        window.requestAnimationFrame(() => openCardTour());
      }
    }
  };

  // ── Button handlers ────────────────────────────────────────────────────
  const triggerPrev = () => triggerSwipe(-1);
  const triggerNext = () => triggerSwipe(1);

  // ── Determine CSS animation class ─────────────────────────────────────
  const getAnimClass = () => {
    if (phase === "exit") {
      return direction > 0 ? "swipe-card exit-left" : "swipe-card exit-right";
    }
    if (phase === "enter") {
      return direction > 0
        ? "swipe-card enter-from-right"
        : "swipe-card enter-from-left";
    }
    return "swipe-card";
  };

  // ── Live drag inline style (finger-follow with tilt) ──────────────────
  const getDragStyle = () => {
    if (isDragging && phase === "idle") {
      const rot = dragX * 0.08;
      return {
        transform: `translateX(${dragX}px) rotate(${rot}deg)`,
        transition: "none",
      };
    }
    if (phase === "exit") {
      return {
        "--swipe-start-x": `${exitStartX}px`,
        "--swipe-start-rot": `${exitStartX * 0.08}deg`,
      };
    }
    return {};
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (contacts.length === 0)
    return <p style={{ color: "var(--ta-cream)" }}>No contacts</p>;

  return (
    <div
      style={styles.container}
      className="glass-card bg-texture"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Single card — animated via CSS classes, data swapped between phases */}
      <div style={styles.cardArea}>
        <div
          className={getAnimClass()}
          style={getDragStyle()}
          onAnimationEnd={handleAnimationEnd}
        >
          {index === 0 ? (
            <MobileIntroCard
              contactCount={contacts.length}
              templateCount={templates.length}
              reportBackEnabled={Boolean(reportBackSettings.enabled)}
              onOpenFaq={onOpenFaq}
              onOpenPrivacy={onOpenPrivacy}
            />
          ) : index === contacts.length + 1 && reportBackSettings.enabled ? (
            <MobileReportBackCard
              contacts={contacts}
              contactReports={contactReports}
              reportBackSettings={reportBackSettings}
              selectedDialCode={selectedDialCode}
            />
          ) : index === contacts.length + 1 ? (
            <MobileFinishedCard
              contacts={contacts}
              contactReports={contactReports}
              selectedDialCode={selectedDialCode}
            />
          ) : (
            <MobileContactCard
              key={displayContact.id}
              contact={displayContact}
              templates={templates}
              selectedDialCode={selectedDialCode}
              extraChannelsEnabled={extraChannelsEnabled}
              callNotes={callNotes}
              reportBackSettings={reportBackSettings}
              report={contactReports[displayContact.id]}
              setReport={(report) =>
                setContactReports((reports) => ({
                  ...reports,
                  [displayContact.id]: report,
                }))
              }
              reportBackRequired={Boolean(reportBackSettings.mandatory)}
              reportBackBlockMessage={blockMessage}
              blockedQuestionIds={blockedQuestionIds}
              isExampleContact={initialContacts.some(
                (example) => example.id === displayContact.id
              )}
              callerName={callerName}
            />
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {(index > 0 || index < itemCount - 1) && (
        <div
          style={styles.navRow}
          data-tour-target="mobile-card-tour-navigation"
        >
          <div style={styles.navSlot}>
            {index > 0 && (
              <button
                onClick={triggerPrev}
                style={styles.navBtn}
                disabled={phase !== "idle"}
                className="hover-lift"
              >
                <ArrowLeft size={20} /> Prev
              </button>
            )}
          </div>
          <div style={styles.navSlot}>
            {index < itemCount - 1 && (
              <>
                <button
                  onClick={() => {
                    triggerNext();
                    onFirstTouch();
                  }}
                  style={{
                    ...styles.navBtn,
                    ...(index > 0 &&
                    index <= contacts.length &&
                    reportBackSettings.mandatory &&
                    !isCurrentReportComplete()
                      ? styles.navBtnBlocked
                      : {}),
                  }}
                  disabled={phase !== "idle"}
                  className="hover-lift"
                >
                  <ArrowRight size={20} /> Next
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {cardTourOpen && (
        <ProductTour
          currentStep={cardTourStep}
          steps={cardTourSteps}
          spotlightSelector={
            cardTourSteps[cardTourStep]?.highlightTarget
              ? `[data-tour-target="${cardTourSteps[cardTourStep].highlightTarget}"]`
              : null
          }
          onNext={goToNextCardTourStep}
          onPrev={goToPreviousCardTourStep}
          onClose={closeCardTour}
          layout="mobile"
          closeOnOverlayClick
          scrollTargetIntoView
        />
      )}
    </div>
  );
}

function buildMobileCardTourSteps({
  hasContacts,
  hasCallNotes,
  extraChannelsEnabled,
  reportBackEnabled,
  reportBackRequired,
}) {
  if (!hasContacts) {
    return [
      {
        eyebrow: "Card guide",
        title: "Load contacts first",
        body: "Once contacts are loaded, this guide will walk through the buttons and prompts on each contact card.",
      },
    ];
  }

  const steps = [
    {
      eyebrow: "Card guide",
      title: "Work one contact at a time",
      body: "Each card is one person. Start with the name and number, then use the actions on the card to call and/or message them",
    },
    {
      eyebrow: "Calling",
      title: "Start with the call button",
      body: "Call opens your phone dialler for this contact. After the call, come back to this card to send a message or move on to the next contact",
      highlightTarget: "mobile-card-tour-call",
    },
  ];

  if (hasCallNotes) {
    steps.push({
      eyebrow: "Call notes",
      title: "Use the reminders",
      body: "These notes are shared prompts from the organiser. They are here to guide the conversation, not to be copied word-for-word.",
      highlightTarget: "mobile-card-tour-notes",
    });
  }

  steps.push({
    eyebrow: "Messages",
    title: "Send a message",
    body: <>Each template has buttons for {!extraChannelsEnabled ? "WhatsApp and SMS" : "WhatsApp, SMS, Signal and Telegram"}.</>,
    highlightTarget: "mobile-card-tour-messages",
  });

  steps.push({
    eyebrow: "Opt-outs",
    title: "Record opt-outs",
    body: "If someone asks not to be contacted again, use Opt out to record whether they want no more calls, messages, or both.",
    highlightTarget: "mobile-card-tour-optout",
  });

  if (reportBackEnabled) {
    steps.push({
      eyebrow: "Reportback",
      title: "Record the outcome",
      body: reportBackRequired
        ? "Reportback is required for this phonebank. Answer the required questions before swiping on, so your organiser knows how the calls went."
        : "Use this button to tell your organiser how the calls went. Your answers are gathered into the report at the end.",
      highlightTarget: "mobile-card-tour-report",
    });
  }

  steps.push({
    eyebrow: "Moving through",
    title: "Swipe or use Next",
    body: "Move through the deck one contact at a time.",
    highlightTarget: "mobile-card-tour-navigation",
  });

  return steps;
}

const styles = {
  container: {
    position: "relative",
    height: "100%",
    userSelect: "none",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    gap: "8px",
  },
  cardArea: {
    position: "relative",
    width: "100%",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  counter: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    marginBottom: "8px",
  },
  navRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "auto",
    width: "100%",
    maxWidth: "320px",
    alignItems: "center",
  },
  navSlot: {
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "6px",
    minWidth: 0,
  },
  navBtn: {
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    width: "100%",
  },
  navBtnBlocked: {
    opacity: 0.58,
  },
};

function MobileIntroCard({
  contactCount,
  templateCount,
  reportBackEnabled,
  onOpenFaq,
  onOpenPrivacy,
}) {
  return (
    <div
      style={infoStyles.card}
      className="glass-card"
      data-tour-target="mobile-card-tour-card"
    >
      <span style={infoStyles.kicker}>Phonebank ready</span>
      <h2 style={infoStyles.title}>You're ready to start</h2>
      <p style={infoStyles.text}>
        Work through the contacts one at a time. Use the buttons on each card to
        call people or send the template messages that have been loaded.
      </p>
      <div style={infoStyles.summary}>
        <span>{contactCount} contacts loaded</span>
        <span>{templateCount} message templates</span>
        {reportBackEnabled && <span>Reportback enabled</span>}
      </div>
      <div style={infoStyles.tips}>
        <span>
          <Phone size={16} /> The Call button opens your phone dialler.
        </span>
        <span>
          <FileText size={16} /> Use 'Templates' if you want to change the
          templates first.
        </span>
      </div>
      <div style={infoStyles.policyLinks}>
        <button type="button" onClick={onOpenFaq} style={infoStyles.faqLink}>
          Read the FAQ
        </button>
        <button
          type="button"
          onClick={onOpenPrivacy}
          style={infoStyles.faqLink}
        >
          Privacy policy
        </button>
      </div>
    </div>
  );
}

function MobileFinishedCard({ contacts, contactReports, selectedDialCode }) {
  const [copied, setCopied] = useState(false);
  const optOutRows = useMemo(
    () => getOptOutRows(contacts, contactReports, selectedDialCode),
    [contacts, contactReports, selectedDialCode]
  );
  const optOutText = useMemo(() => getOptOutPlainText(optOutRows), [optOutRows]);
  const optOutWhatsAppLink = `https://wa.me/?text=${encodeURIComponent(
    optOutText
  )}`;
  const optOutSmsLink = generateSmsHref("", optOutText, selectedDialCode);

  const copyOptOuts = async () => {
    try {
      await navigator.clipboard.writeText(optOutText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable in some browsers.
    }
  };

  if (optOutRows.length > 0) {
    return (
      <div style={infoStyles.card} className="glass-card">
        <CheckCircle size={42} color="var(--ta-green)" />
        <h2 style={infoStyles.title}>You’re finished</h2>
        <p style={infoStyles.text}>
          Send these opt-outs to your organiser or add them to the CRM.
        </p>
        <div style={infoStyles.summary}>
          {optOutRows.map((row) => (
            <span key={`${row.name}-${row.phone}`}>
              {row.name}: no more{" "}
              {[
                row.optOut.calls ? "calls" : "",
                row.optOut.texts ? "messages" : "",
              ]
                .filter(Boolean)
                .join(" and ")}
            </span>
          ))}
        </div>
        <div style={infoStyles.optOutActions}>
          <a
            href={optOutWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            style={infoStyles.copyBtn}
            className="message-link-action hover-lift"
          >
            <MessageCircle size={16} />
            Send over WhatsApp
          </a>
          <a
            href={optOutSmsLink}
            style={infoStyles.secondaryAction}
            className="message-link-action hover-lift"
          >
            <Send size={16} />
            Send over SMS
          </a>
          <button
            type="button"
            onClick={copyOptOuts}
            style={infoStyles.secondaryAction}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            Copy opt-out message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={infoStyles.card} className="glass-card">
      <CheckCircle size={42} color="var(--ta-green)" />
      <h2 style={infoStyles.title}>You’re finished</h2>
      <p style={infoStyles.text}>
        You’ve reached the end of this phonebank. Nice one. You can go back
        through contacts if you need to copy a number or send another message.
      </p>
    </div>
  );
}

const infoStyles = {
  card: {
    width: "100%",
    maxWidth: "420px",
    height: "100%",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "14px",
    color: "var(--ta-cream)",
  },
  kicker: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-green)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "calc(30px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: 0,
  },
  text: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: 0,
  },
  summary: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    border: "1px solid rgba(79, 159, 104, 0.24)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    borderRadius: "10px",
    padding: "12px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  tips: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  policyLinks: {
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    borderTop: "1px solid var(--ta-border-subtle)",
    paddingTop: "12px",
  },
  faqLink: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--ta-green)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    textDecoration: "none",
    padding: 0,
  },
  copyBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    border: "1px solid var(--ta-green)",
    borderRadius: "10px",
    padding: "11px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    textDecoration: "none",
  },
  optOutActions: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  secondaryAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.44)",
    borderRadius: "10px",
    padding: "11px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    textDecoration: "none",
  },
};
