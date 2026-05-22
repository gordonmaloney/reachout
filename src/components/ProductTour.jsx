import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { productTourSteps } from "../data/productTourSteps";

export default function ProductTour({
  currentStep,
  steps = productTourSteps,
  spotlightSelector,
  onNext,
  onPrev,
  onClose,
}) {
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const [spotlightRect, setSpotlightRect] = useState(null);

  useEffect(() => {
    let frame = 0;

    if (!spotlightSelector) {
      frame = window.requestAnimationFrame(() => setSpotlightRect(null));
      return () => window.cancelAnimationFrame(frame);
    }

    const updateSpotlight = () => {
      const element = document.querySelector(spotlightSelector);
      if (!element) {
        setSpotlightRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const inset = 8;
      setSpotlightRect({
        top: Math.max(0, rect.top - inset),
        left: Math.max(0, rect.left - inset),
        right: Math.min(window.innerWidth, rect.right + inset),
        bottom: Math.min(window.innerHeight, rect.bottom + inset),
      });
    };

    frame = window.requestAnimationFrame(updateSpotlight);
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [spotlightSelector, currentStep]);

  const overlayPieces = spotlightRect
    ? [
        { top: 0, left: 0, right: 0, height: spotlightRect.top },
        {
          top: spotlightRect.bottom,
          left: 0,
          right: 0,
          bottom: 0,
        },
        {
          top: spotlightRect.top,
          left: 0,
          width: spotlightRect.left,
          height: spotlightRect.bottom - spotlightRect.top,
        },
        {
          top: spotlightRect.top,
          left: spotlightRect.right,
          right: 0,
          height: spotlightRect.bottom - spotlightRect.top,
        },
      ]
    : [{ inset: 0 }];

  return (
    <>
      {overlayPieces.map((piece, index) => (
        <div
          key={`${piece.top || 0}-${piece.left || 0}-${index}`}
          style={{
            ...styles.overlayPiece,
            ...piece,
          }}
        />
      ))}
      {spotlightRect && (
        <div
          style={{
            ...styles.spotlightClickBlocker,
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.right - spotlightRect.left,
            height: spotlightRect.bottom - spotlightRect.top,
          }}
        />
      )}
      <div style={styles.card}>
        <button
          type="button"
          onClick={onClose}
          style={styles.closeBtn}
          aria-label="Skip product tour"
        >
          <X size={16} />
        </button>

        <span style={styles.eyebrow}>{step.eyebrow}</span>
        <h3 style={styles.title}>{step.title}</h3>
        <p style={styles.body}>{step.body}</p>
        {step.highlights?.length > 0 && (
          <div style={styles.highlights}>
            {step.highlights.map((highlight) => (
              <span key={highlight} style={styles.highlightPill}>
                {highlight}
              </span>
            ))}
          </div>
        )}

        <div style={styles.progressRow}>
          {steps.map((item, index) => (
            <span
              key={`${item.stage}-${index}`}
              style={{
                ...styles.progressDot,
                ...(index === currentStep ? styles.progressDotActive : {}),
              }}
            />
          ))}
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep === 0}
            style={{
              ...styles.secondaryBtn,
              ...(currentStep === 0 ? styles.secondaryBtnDisabled : {}),
            }}
          >
            Back
          </button>
          <button type="button" onClick={onNext} style={styles.primaryBtn}>
            {isLast ? (
              <>
                Done <Check size={16} />
              </>
            ) : (
              <>
                Next <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlayPiece: {
    position: "fixed",
    zIndex: 1100,
    backgroundColor: "var(--tour-overlay)",
    pointerEvents: "auto",
    backdropFilter: "blur(1px)",
  },
  spotlightClickBlocker: {
    position: "fixed",
    zIndex: 1101,
    backgroundColor: "transparent",
    pointerEvents: "auto",
  },
  card: {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    zIndex: 1102,
    width: "min(420px, calc(100vw - 48px))",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--tour-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "14px",
    padding: "20px",
    color: "var(--ta-cream)",
    boxShadow: "var(--tour-card-shadow)",
  },
  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-green)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "calc(28px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    marginTop: "6px",
    marginBottom: "8px",
  },
  body: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    paddingRight: "18px",
  },
  highlights: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
    marginTop: "12px",
  },
  highlightPill: {
    border: "1px solid rgba(79, 159, 104, 0.32)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    color: "var(--ta-green)",
    borderRadius: "999px",
    padding: "4px 9px",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    fontFamily: "var(--font-body)",
    fontWeight: 700,
  },
  progressRow: {
    display: "flex",
    gap: "6px",
    marginTop: "16px",
  },
  progressDot: {
    width: "22px",
    height: "4px",
    borderRadius: "999px",
    backgroundColor: "var(--ta-border-medium)",
  },
  progressDotActive: {
    backgroundColor: "var(--ta-green)",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "18px",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-medium)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  secondaryBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  primaryBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};
