import { Phone, X } from "lucide-react";

export default function ReportbackNumberModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
          <X size={18} />
        </button>
        <div style={styles.iconWrap}>
          <Phone size={22} />
        </div>
        <span style={styles.eyebrow}>Reportbacks enabled</span>
        <h3 style={styles.title}>Add your number first</h3>
        <p style={styles.text}>
          Phonebankers need somewhere to send their reportbacks. Add your phone
          number here, or turn reportbacks off before leaving this stage.
        </p>
        <button type="button" onClick={onClose} style={styles.primaryBtn}>
          Back to setup
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  modal: {
    width: "min(390px, 100%)",
    position: "relative",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "14px",
    padding: "22px",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
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
  iconWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.12)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
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
    fontSize: "calc(28px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    margin: "5px 0 8px",
  },
  text: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    marginBottom: "16px",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
};
