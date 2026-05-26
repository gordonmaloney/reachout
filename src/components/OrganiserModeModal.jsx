import { CheckCircle, Users, X } from "lucide-react";

export default function OrganiserModeModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={styles.closeBtn}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div style={styles.iconWrap}>
          <Users size={22} />
        </div>
        <span style={styles.eyebrow}>Organiser mode</span>
        <h3 style={styles.title}>Call notes and reportbacks</h3>
        <p style={styles.text}>
          Organiser mode adds an extra stage for you to users talking points and
          allow them to give you a reportback on how the call went. It also
          unlocks hosting tools, so you can set divvy up contacts between
          multiple people, with the option to make links password-protected
        </p>
        <div style={styles.list}>
          <span style={styles.item}>
            <CheckCircle size={15} /> Add talking points and reminders for
            callers
          </span>
          <span style={styles.item}>
            <CheckCircle size={15} /> Get reportbacks about how the calls went
          </span>
          <span style={styles.item}>
            <CheckCircle size={15} /> Securely divvy up contacts between
            participants
          </span>
        </div>
        <button type="button" onClick={onClose} style={styles.primaryBtn}>
          Got it
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
    width: "min(430px, 100%)",
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
    border: "1px solid var(--ta-border-subtle)",
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
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    margin: "16px 0",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
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
