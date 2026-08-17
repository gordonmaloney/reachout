import StageShell from "./StageShell";
import { ArrowLeft } from "lucide-react";

const releases = [
  {
    version: "1.0.2",
    date: "17 June 2026",
    summary:
      "A batch of organiser-mode, contact-import, and mobile phonebanking improvements.",
    groups: [
      {
        title: "Contact import",
        items: [
          "Accepted pasting contacts into the preview box.",
          "Added manual one-by-one contact creation.",
          "Improved error handling and warnings when numbers cannot be imported or look incorrectly formatted.",
        ],
      },
      {
        title: "Workflow polish",
        items: [
          "Moved newly created text fields into focus automatically.",
          "Fixed the organiser mode modal so pressing Enter or Space closes it instead of toggling organiser mode off again.",
        ],
      },
      {
        title: "Organiser sessions",
        items: [
          "Added the {CALLERNAME} token for shared and divvied-up sessions.",
          "Added token chips and checks to help organisers use {FIRSTNAME} and {CALLERNAME} correctly.",
          "Added a call notes enable toggle so it matches the other organiser settings.",
        ],
      },
      {
        title: "Mobile phonebanking",
        items: [
          "Added opt-out buttons on contact cards for requests to stop calls or messages.",
          "Included opt-outs in reportback flows and end-of-session summaries.",
        ],
      },
    ],
  },
  {
    version: "1.0.1",
    date: "4 June 2026",
    summary: "Template editing got easier to organise.",
    groups: [
      {
        title: "Templates",
        items: [
          "Added click-and-drag reordering for template messages.",
        ],
      },
    ],
  },
];

export default function ReleaseNotesPage({ onBack }) {
  return (
    <StageShell
      stageNumLabel="Release notes"
      title="RELEASE NOTES"
      accentPhrase="NOTES"
      accentVariant={1}
      subtitle="Small notes on what has changed in Reachout."
      allowOverflow
    >
      {onBack && (
        <button type="button" onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Reachout
        </button>
      )}

      <div style={styles.timeline}>
        {releases.map((release) => (
          <article key={release.version} style={styles.release}>
            <div style={styles.releaseHeader}>
              <span style={styles.version}>{release.version}</span>
              <time style={styles.date}>{release.date}</time>
            </div>
            <p style={styles.summary}>{release.summary}</p>

            <div style={styles.groupList}>
              {release.groups.map((group) => (
                <section key={group.title} style={styles.group}>
                  <h3 style={styles.groupTitle}>{group.title}</h3>
                  <ul style={styles.items}>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </StageShell>
  );
}

const styles = {
  backBtn: {
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--ta-green)",
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.35)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    cursor: "pointer",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  release: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "16px",
  },
  releaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "12px",
    borderBottom: "1px solid var(--ta-border-subtle)",
    paddingBottom: "10px",
    marginBottom: "10px",
  },
  version: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  date: {
    color: "var(--ta-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    textTransform: "uppercase",
  },
  summary: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: "0 0 14px",
  },
  groupList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  group: {
    border: "1px solid rgba(79, 159, 104, 0.16)",
    borderRadius: "8px",
    backgroundColor: "rgba(79, 159, 104, 0.045)",
    padding: "12px",
  },
  groupTitle: {
    color: "var(--ta-cream)",
    fontSize: "calc(17px * var(--reachout-text-scale, 1))",
    margin: "0 0 8px",
  },
  items: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: 0,
    paddingLeft: "18px",
  },
};
