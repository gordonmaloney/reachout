import StageShell from "./StageShell";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy({ onBack }) {
  return (
    <StageShell
      stageNumLabel="Privacy"
      title="PRIVACY POLICY"
      accentPhrase="PRIVACY"
      accentVariant={2}
      subtitle={
        <>
          Reachout is designed specifically <u>not</u> to access your contacts'
          data; everything is handled locally, inside your own
          browser.
        </>
      }
      allowOverflow
    >
      {onBack && (
        <button type="button" onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Reachout
        </button>
      )}

      <div style={styles.list}>
        <article style={styles.item}>
          <h3 style={styles.heading}>How Reach Out works</h3>
          <p style={styles.text}>
            Reachout is designed to work mostly inside your browser. Contact
            lists, message templates, call notes, and reportback prompts are
            processed locally on your device rather than uploaded to a central
            database controlled by Reach Out.
          </p>
        </article>

        <article style={styles.item}>
          <h3 style={styles.heading}>Local storage and preferences</h3>
          <p style={styles.text}>
            Reachput may store small pieces of UX information in your browser,
            such as whether you have completed the product tour or your display
            preferences (for example light or dark mode). This is used only to
            improve the experience of using the tool, and does not include
            access to any contact data.
          </p>
        </article>

        <article style={styles.item}>
          <h3 style={styles.heading}>Share links and phonebanks</h3>
          <p style={styles.text}>
            When you create a phonebank share link, the phonebank data is packed
            into the link itself so it can be opened on another device or shared
            with another user.
            <br />
            <br />
            These links do not expire automatically. Unprotected links are not
            encrypted. Anyone with access to the link may be able to access the
            phonebank data inside it, including contact numbers and message
            templates.
          </p>
        </article>

        <article style={styles.item}>
          <h3 style={styles.heading}>Password-protected links</h3>
          <p style={styles.text}>
            Reachout supports optional password protection for share links. If
            enabled, the phonebank data is encrypted in the browser and the
            password is required to unlock it.
            <br />
            <br />
            However, anyone with both the link and the password will still be
            able to access the data. Password-protected links also do not expire
            automatically.
          </p>
        </article>

        <article style={styles.item}>
          <h3 style={styles.heading}>Recommendations for organisers</h3>
          <p style={styles.text}>
            Organisations and organisers are responsible for deciding how they
            share phonebanks and contact data with volunteers or staff.
            <br />
            <br />
            We recommend:
            <br />• only sharing links with people who should have access
            <br />• sharing passwords separately from links where possible
            <br />• deleting links from WhatsApp, Signal, email, or other chats
            once they are no longer needed
            <br />• ensuring volunteers understand how contact data should be
            handled
            <br />• considering volunteer agreements or data handling policies
            where appropriate
          </p>
        </article>

        <article style={styles.item}>
          <h3 style={styles.heading}>Third-party services</h3>
          <p style={styles.text}>
            Reachout may rely on third-party hosting providers or infrastructure
            services. Their systems may generate standard technical logs such as
            IP addresses or request information needed to operate and secure the
            service.
          </p>
        </article>
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
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  item: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "16px",
  },
  heading: {
    color: "var(--ta-green)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: "0 0 8px",
  },
  text: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.6,
    margin: 0,
  },
};
