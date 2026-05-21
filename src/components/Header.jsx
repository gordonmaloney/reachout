import { ExternalLink, HelpCircle } from "lucide-react";

export default function Header({ onStartTour }) {
  return (
    <header style={styles.header}>
      <div style={styles.logoGroup}>
        <span style={styles.tenantAct}>
          TENANT<span style={styles.actGreen}>ACT</span>
        </span>
        <span style={styles.divider}>|</span>
        <span style={styles.reachout}>
          <span style={styles.actGreen}>REACH</span>OUT
        </span>
      </div>

      <div style={styles.headerActions}>
        <button
          type="button"
          onClick={onStartTour}
          style={styles.howItWorksBtn}
          className="hover-lift"
        >
          <HelpCircle size={14} color="var(--ta-green)" />
          <span>HOW IT WORKS</span>
        </button>

        <a
          href="https://www.livingrent.org"
          target="_blank"
          rel="noreferrer"
          style={styles.livingRentLink}
          className="hover-lift"
        >
          <span>LIVING RENT</span>
          <ExternalLink size={14} color="var(--ta-cream)" />
        </a>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "80px",
    backgroundColor: "rgba(27, 34, 28, 0.98)",
    borderBottom: "1px solid rgba(244, 239, 228, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  tenantAct: {
    fontFamily: "var(--font-heading)",
    fontSize: "34px",
    color: "var(--ta-cream)",
    letterSpacing: "0.035em",
  },
  actGreen: {
    color: "var(--ta-green)",
    textShadow: "none",
  },
  divider: {
    color: "rgba(247, 244, 236, 0.25)",
    fontSize: "24px",
    fontWeight: "300",
  },
  reachout: {
    fontFamily: "var(--font-heading)",
    fontSize: "34px",
    color: "var(--ta-cream)",
    letterSpacing: "0.035em",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  howItWorksBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(79, 159, 104, 0.09)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    color: "var(--ta-green)",
    padding: "8px 16px",
    borderRadius: "6px",
    fontFamily: "var(--font-heading)",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.055em",
  },
  livingRentLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid rgba(247, 244, 236, 0.28)",
    color: "var(--ta-cream)",
    padding: "8px 20px",
    borderRadius: "6px",
    fontFamily: "var(--font-heading)",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0.055em",
    textDecoration: "none",
    textTransform: "uppercase",
    transition: "all 0.2s ease",
  },
};
