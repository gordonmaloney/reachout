import { CheckCircle, Users, X } from "lucide-react";

export default function OrganiserModeModal({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="Close">
          <X size={18} />
        </button>
        <div style={styles.iconWrap}>
          <Users size={22} />
        </div>
        <span style={styles.eyebrow}>Organiser mode</span>
        <h3 style={styles.title}>Set up a fuller phonebank</h3>
        <p style={styles.text}>
          Organiser mode adds an extra setup stage for call notes and reportback
          questions. It also unlocks hosting tools so you can split contacts
          between participants.
        </p>
        <div style={styles.list}>
          <span style={styles.item}><CheckCircle size={15} /> Add prompts for callers</span>
          <span style={styles.item}><CheckCircle size={15} /> Collect reportbacks from each contact</span>
          <span style={styles.item}><CheckCircle size={15} /> Split a session between participants</span>
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
    backgroundColor: "rgba(0,0,0,0.62)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  modal: {
    width: "min(430px, 100%)",
    position: "relative",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "14px",
    padding: "22px",
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
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "28px",
    letterSpacing: "0.05em",
    margin: "5px 0 8px",
  },
  text: {
    color: "rgba(247, 241, 232, 0.72)",
    fontSize: "13px",
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
    color: "rgba(247, 241, 232, 0.78)",
    fontSize: "13px",
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "15px",
  },
};
