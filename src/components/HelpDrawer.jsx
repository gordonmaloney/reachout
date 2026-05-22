import {
  X,
  HelpCircle,
  FileSpreadsheet,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

export default function HelpDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <HelpCircle size={20} color="var(--ta-green)" />
            <h2 style={styles.drawerTitle}>QUICK GUIDE</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.noteBox}>
            <HelpCircle
              size={16}
              color="var(--ta-green)"
              style={{ flexShrink: 0 }}
            />
            <p style={styles.securityText}>
              REACHOUT helps you turn contact lists and message templates into
              quick WhatsApp and SMS links — useful for follow-ups,
              mobilisation, turnout, and supporter care.
            </p>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <FileSpreadsheet size={16} color="var(--ta-green)" />
              <span>1. Add Contacts</span>
            </h3>
            <p style={styles.sectionDesc}>
              Paste names and phone numbers from a spreadsheet, notes app, or
              contact list. One person per line works best.
            </p>
            <div style={styles.codeSample}>
              <span style={styles.codeLabel}>EXAMPLE FORMAT:</span>
              <pre style={styles.pre}>
                {`Sandy Mills, +44 7712 345678
Mia Benson, +44 7345 678901
Jake Woods, +44 3461 234567`}
              </pre>
            </div>
            <ul style={styles.bulletList}>
              <li>Include both a name and phone number on each line.</li>
              <li>
                Use international prefixes like <code>+44</code> for WhatsApp
                links.
              </li>
              <li>
                Prioritise people with a clear reason to be contacted — recent
                sign-ups, local members, event attendees, or people who have
                already shown interest.
              </li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <MessageSquare size={16} color="var(--ta-green)" />
              <span>2. Write Messages</span>
            </h3>
            <p style={styles.sectionDesc}>
              Good organising messages are personal, specific, and clear about
              what you are asking someone to do.
            </p>
            <ul style={styles.bulletList}>
              <li>
                Use <code>{"{FIRSTNAME}"}</code> to personalise each message.
              </li>
              <li>
                Keep it short enough to feel like something you would genuinely
                send yourself.
              </li>
              <li>
                Lead with context: why this person, why now, and why it matters.
              </li>
              <li>
                Use a clear ask. A <strong>soft ask</strong> is low-commitment,
                like “Can I send you the details?” or “Are you interested?”
              </li>
              <li>
                A <strong>hard ask</strong> is more direct, like “Can you come
                on Thursday at 7?” or “Will you call your MSP today?”
              </li>
              <li>
                For warm contacts, move towards a hard ask. For colder contacts,
                start with a soft ask and build from there.
              </li>
              <li>
                WhatsApp supports simple formatting like <code>*bold*</code> and{" "}
                <code>_italics_</code>; SMS will be sent as plain text.
              </li>
            </ul>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <PhoneCall size={16} color="var(--ta-green)" />
              <span>3. Phonebanking Tips</span>
            </h3>
            <p style={styles.sectionDesc}>
              The aim is not just to pass on information — it is to move someone
              one step further into action.
            </p>
            <ul style={styles.bulletList}>
              <li>
                Say who you are, where you are calling from, and why you are
                calling in the first sentence.
              </li>
              <li>
                Start with a question, not a speech. Listen for what they care
                about before giving details.
              </li>
              <li>
                Match the ask to the person. New or unsure supporters may need a
                soft ask; committed supporters should get a clear hard ask.
              </li>
              <li>
                Always offer a concrete next step: RSVP, attend a meeting, make
                a call, share a link, take a shift, or expect a follow-up.
              </li>
              <li>
                If they say yes, confirm the details and send them immediately
                by text.
              </li>
              <li>
                If they are unsure, ask what would make it easier for them to
                take part.
              </li>
              <li>
                If they cannot talk, offer to text the key information or
                arrange a better time.
              </li>
            </ul>
          </div>
        </div>

        <div style={styles.footer}>
          <button
            onClick={onClose}
            style={styles.footerBtn}
            className="hover-lift"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--modal-overlay)",
    backdropFilter: "blur(4px)",
    zIndex: 999,
    display: "flex",
    justifyContent: "flex-end",
  },
  drawer: {
    width: "460px",
    maxWidth: "90%",
    height: "100%",
    backgroundColor: "var(--ta-ink)",
    borderLeft: "1px solid rgba(79, 159, 104, 0.25)",
    boxShadow: "var(--green-glow)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid var(--ta-border-subtle)",
  },
  titleBlock: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  drawerTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    letterSpacing: "0.05em",
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--ta-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  noteBox: {
    display: "flex",
    gap: "12px",
    backgroundColor: "rgba(79, 159, 104, 0.06)",
    border: "1px solid rgba(79, 159, 104, 0.2)",
    borderRadius: "12px",
    padding: "16px",
    alignItems: "center",
  },
  securityText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-gray)",
    lineHeight: "1.45",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    letterSpacing: "0.03em",
  },
  sectionDesc: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-gray)",
    lineHeight: "1.45",
  },
  codeSample: {
    backgroundColor: "var(--surface-raised)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  codeLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "calc(9px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
    marginBottom: "6px",
    display: "block",
  },
  pre: {
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    margin: 0,
    lineHeight: "1.5",
  },
  bulletList: {
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
    color: "var(--ta-gray)",
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  orderList: {
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
    color: "var(--ta-gray)",
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  footer: {
    padding: "20px 24px",
    borderTop: "1px solid var(--ta-border-subtle)",
    backgroundColor: "var(--surface-raised)",
    display: "flex",
    justifyContent: "flex-end",
  },
  footerBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.08em",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: "bold",
  },
};
