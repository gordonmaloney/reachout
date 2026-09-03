import { AlertTriangle, LoaderCircle } from "lucide-react";

export default function TransferLinkStatus({
  status,
  theme = "dark",
  fontScale = 1,
}) {
  const isInvalid = status === "invalid";

  return (
    <main
      className="mobile-workspace bg-texture"
      data-theme={theme}
      style={{ ...styles.page, "--reachout-text-scale": fontScale }}
    >
      <div style={styles.brand} aria-label="Reachout by TenantAct">
        <span>
          <span style={styles.green}>REACH</span>OUT
        </span>
        <span style={styles.divider}>|</span>
        <span style={styles.credit}>
          by Tenant<span style={styles.green}>Act</span>
        </span>
      </div>
      <section style={styles.card} role={isInvalid ? "alert" : "status"}>
        {isInvalid ? (
          <AlertTriangle size={34} color="var(--ta-red)" aria-hidden="true" />
        ) : (
          <LoaderCircle
            size={34}
            color="var(--ta-green)"
            className="transfer-link-spinner"
            aria-hidden="true"
          />
        )}
        <span style={styles.kicker}>
          {isInvalid ? "Share link error" : "Shared phonebank"}
        </span>
        <h1 style={styles.title}>
          {isInvalid
            ? "There’s a problem with this link"
            : "Opening phonebank…"}
        </h1>
        {isInvalid && (
          <>
            <p style={styles.text}>
              It looks like there is something wrong with this link. If it was
              sent to you over WhatsApp, you may need to click “Read more” on
              the message to expand the link fully before trying again. If that
              doesn’t work, let the person who sent it to you know and they’ll
              be able to sort it.
            </p>
            <a href="/" style={styles.action}>
              Open Reachout without this link
            </a>
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "100dvh",
    backgroundColor: "var(--modal-card-bg)",
    color: "var(--ta-cream)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "clamp(18px, 4vw, 42px)",
  },
  brand: {
    width: "100%",
    maxWidth: "520px",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(27px * var(--reachout-text-scale, 1))",
  },
  green: { color: "var(--ta-green)" },
  divider: { color: "var(--ta-muted)", fontSize: "0.78em" },
  credit: { fontSize: "0.58em", color: "var(--ta-muted-strong)" },
  card: {
    width: "100%",
    maxWidth: "520px",
    minWidth: 0,
    boxSizing: "border-box",
    margin: "auto 0",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "16px",
    backgroundColor: "var(--surface-subtle)",
    boxShadow: "var(--modal-card-shadow)",
    padding: "clamp(22px, 5vw, 34px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  kicker: {
    marginTop: "14px",
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "7px 0 11px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(31px * var(--reachout-text-scale, 1))",
    lineHeight: 1.05,
    overflowWrap: "anywhere",
  },
  text: {
    margin: 0,
    color: "var(--ta-muted-strong)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  },
  action: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "22px",
    border: "1px solid var(--ta-green)",
    borderRadius: "999px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    padding: "11px 16px",
    textAlign: "center",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
};
