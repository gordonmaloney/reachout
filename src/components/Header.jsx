import { ExternalLink, HelpCircle } from "lucide-react";

export default function Header({
  onStartTour,
}) {
  return (
    <header style={styles.header}>
      <div style={styles.logoGroup}>
        <span style={styles.reachout}>
          <span style={styles.actGreen}>REACH</span>OUT
        </span>
        <span style={styles.divider}>|</span>
        <span style={styles.tenantCredit}>
          by Tenant<span style={styles.actGreen}>Act</span>
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
          <span>How it works</span>
        </button>

        <a
          href="https://www.livingrent.org"
          target="_blank"
          rel="noreferrer"
          style={styles.livingRentLink}
          className="hover-lift"
        >
          <span>Living Rent</span>
          <ExternalLink size={14} color="var(--ta-cream)" />
        </a>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: "80px",
    backgroundColor: "var(--ta-ink)",
    borderBottom: "1px solid var(--ta-border-subtle)",
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
  actGreen: {
    color: "var(--ta-green)",
    textShadow: "none",
  },
  divider: {
    color: "var(--ta-divider)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    fontWeight: "300",
  },
  reachout: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(38px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    letterSpacing: "0.035em",
  },
  tenantCredit: {
    fontFamily: "var(--font-body)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
    letterSpacing: "0.02em",
    textTransform: "none",
    whiteSpace: "nowrap",
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
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 600,
    letterSpacing: "0.055em",
  },
  livingRentLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-medium)",
    color: "var(--ta-cream)",
    padding: "8px 20px",
    borderRadius: "6px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 600,
    letterSpacing: "0.055em",
    textDecoration: "none",
    textTransform: "uppercase",
    transition: "all 0.2s ease",
  },
};
