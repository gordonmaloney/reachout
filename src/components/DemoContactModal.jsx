export default function DemoContactModal({
  isOpen,
  onClose,
  theme = "dark",
  fontScale = 1,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="mobile-workspace"
      data-theme={theme}
      style={{ ...styles.overlay, "--reachout-text-scale": fontScale }}
      role="presentation"
      onClick={onClose}
    >
      <div
        style={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="demo-contact-title"
        aria-describedby="demo-contact-description"
        onClick={(event) => event.stopPropagation()}
      >
        <span style={styles.kicker}>Example data</span>
        <h3 id="demo-contact-title" style={styles.title}>
          This is a demo contact
        </h3>
        <p id="demo-contact-description" style={styles.text}>
          These are demo contacts included to show how Reachout works. Please
          don’t call or message them. Edit or replace them with your real
          contacts first.
        </p>
        <button type="button" onClick={onClose} style={styles.button} autoFocus>
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
    zIndex: 2200,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  modal: {
    width: "100%",
    maxWidth: "380px",
    minWidth: 0,
    boxSizing: "border-box",
    border: "1px solid rgba(211, 106, 88, 0.42)",
    borderRadius: "14px",
    backgroundColor: "var(--modal-card-bg)",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
    padding: "20px",
  },
  kicker: {
    color: "var(--ta-red)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(10px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "7px 0 9px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    lineHeight: 1.05,
  },
  text: {
    margin: 0,
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
  },
  button: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "16px",
    border: "1px solid var(--ta-green)",
    borderRadius: "999px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    padding: "10px 14px",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
};
