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
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: "24px",
    pointerEvents: "auto",
  },
  card: {
    position: "relative",
    width: "min(420px, 100%)",
    backgroundColor: "rgba(6, 18, 14, 0.96)",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "14px",
    padding: "20px",
    color: "var(--ta-cream)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.42)",
  },
  closeBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "1px solid rgba(247, 244, 236, 0.18)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-green)",
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "28px",
    letterSpacing: "0.05em",
    marginTop: "6px",
    marginBottom: "8px",
  },
  body: {
    color: "rgba(247,244,236,0.74)",
    fontSize: "13px",
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
    backgroundColor: "rgba(247, 244, 236, 0.18)",
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
    border: "1px solid rgba(247, 244, 236, 0.24)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
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
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};
