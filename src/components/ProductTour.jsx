import { ArrowRight, Check, X } from "lucide-react";
import { productTourSteps } from "../data/productTourSteps";

export default function ProductTour({
  currentStep,
  steps = productTourSteps,
  onNext,
  onPrev,
  onClose,
}) {
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div style={styles.overlay}>
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

        <div style={styles.progressRow}>
          {steps.map((item, index) => (
            <span
              key={item.stage}
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
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1100,
    backgroundColor: "var(--tour-overlay)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: "24px",
    pointerEvents: "auto",
    backdropFilter: "blur(1.5px)",
  },
  card: {
    position: "relative",
    width: "min(420px, 100%)",
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
