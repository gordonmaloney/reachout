// MobileSwipeDeck – single-card animation using CSS @keyframes + onAnimationEnd
// Inspired by the SwipeExplainer pattern: phase-driven, no setTimeout for animation sync.
import { useRef, useState } from "react";
import MobileContactCard from "./MobileContactCard";
import MobileReportBackCard from "./MobileReportBackCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  onIndexChange = () => { },
  initialIndex = 0,
}) {
  const itemCount = contacts.length + (reportBackSettings.enabled ? 1 : 0);
  const [index, setIndex] = useState(initialIndex);
  // phase: "idle" | "exit" | "enter"
  const [phase, setPhase] = useState("idle");
  // direction: 1 = next (exits left, enters from right), -1 = prev (exits right, enters from left)
  const [direction, setDirection] = useState(0);
  const [exitStartX, setExitStartX] = useState(0);
  // The contact data currently displayed on the card
  const [displayContact, setDisplayContact] = useState(contacts[initialIndex]);
  // Pending index to commit after exit animation
  const pendingIndexRef = useRef(null);

  // Drag state for live finger-follow
  const startXRef = useRef(null);
  const startYRef = useRef(null);
  const startInScrollableCardRef = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const reportQuestions = reportBackSettings.questions?.filter((question) =>
    question.label?.trim()
  ) || [];

  const isCurrentReportComplete = () => {
    if (!reportBackSettings.enabled || !reportBackSettings.mandatory) return true;
    if (index >= contacts.length) return true;

    const contact = contacts[index];
    const report = contactReports[contact?.id];
    if (!report?.contacted) return false;
    if (reportQuestions.length === 0) return true;

    return reportQuestions.every((question) => {
      const answer = report.answers?.[question.id];
      return String(answer || "").trim().length > 0;
    });
  };

  // ── Gesture handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (phase !== "idle") return;
    const touch = e.touches ? e.touches[0] : e;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startInScrollableCardRef.current = Boolean(e.target.closest?.(".mobile-card-scroll"));
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    setDragX(touch.clientX - startXRef.current);
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    const THRESHOLD = 50;

    if (Math.abs(dx) >= THRESHOLD || Math.abs(dy) >= THRESHOLD) {
      // Pick dominant axis
      if (Math.abs(dx) >= Math.abs(dy)) {
        // Horizontal: swipe left = next, swipe right = prev
        if (dx < -THRESHOLD) triggerSwipe(1, dx);
        else if (dx > THRESHOLD) triggerSwipe(-1, dx);
      } else if (!startInScrollableCardRef.current) {
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
  };

  // ── Trigger a swipe (dir: 1=next, -1=prev) ────────────────────────────
  const triggerSwipe = (dir, startX = 0) => {
    if (phase !== "idle") return false;
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= itemCount) return false;
    if (dir > 0 && !isCurrentReportComplete()) {
      setBlockMessage("Complete the reportback before moving to the next contact.");
      window.setTimeout(() => setBlockMessage(""), 2200);
      return false;
    }

    setBlockMessage("");
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
      setDisplayContact(contacts[newIdx] || contacts[0]);
      setPhase("enter"); // → starts CSS enter animation
    } else if (phase === "enter") {
      // Entry animation finished — card is centered & fully visible.
      setPhase("idle");
      setDirection(0);
      setExitStartX(0);
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
      return direction > 0 ? "swipe-card enter-from-right" : "swipe-card enter-from-left";
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
          {index === contacts.length && reportBackSettings.enabled ? (
            <MobileReportBackCard
              contacts={contacts}
              contactReports={contactReports}
              reportBackSettings={reportBackSettings}
              selectedDialCode={selectedDialCode}
            />
          ) : (
            <MobileContactCard
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
            />
          )}
        </div>
      </div>

      {blockMessage && <div style={styles.blockMessage}>{blockMessage}</div>}

      {/* Navigation buttons */}
      <div style={styles.navRow}>
        <button
          onClick={triggerPrev}
          style={styles.navBtn}
          disabled={index === 0 || phase !== "idle"}
          className="hover-lift"
        >
          <ArrowLeft size={20} /> Prev
        </button>
        <button
          onClick={triggerNext}
          style={{
            ...styles.navBtn,
            ...(index < contacts.length && reportBackSettings.mandatory && !isCurrentReportComplete()
              ? styles.navBtnBlocked
              : {}),
          }}
          disabled={index >= itemCount - 1 || phase !== "idle"}
          className="hover-lift"
        >
          <ArrowRight size={20} /> Next
        </button>
      </div>
    </div>
  );
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
    padding: "24px",
    gap: "12px",
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
    display: "flex",
    gap: "24px",
    marginTop: "auto",
  },
  blockMessage: {
    color: "var(--ta-muted-strong)",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    textAlign: "center",
    width: "100%",
    maxWidth: "380px",
  },
  navBtn: {
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  navBtnBlocked: {
    opacity: 0.58,
  },
};
