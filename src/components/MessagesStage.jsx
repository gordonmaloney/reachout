// src/components/MessagesStage.jsx
import { Info, X, Plus, ArrowRight, Check } from "lucide-react";
import { initialTemplates } from "../data/mockData";
import StageShell from "./StageShell";
import { useEffect } from "react";

const FIRSTNAME_TOKEN = "{FIRSTNAME}";
const FIRSTNAME_BRACKET_TOKEN_MISTAKE_PATTERNS = [
  /[[{(]\s*first\s*[_-]?\s*name\s*[\]})]/gi,
  /[[{(]\s*firstname\s*[\]})]/gi,
];
const FIRSTNAME_BARE_TOKEN_MISTAKE_PATTERN = /\bFIRST\s*[_-]?\s*NAME\b/g;

function hasFirstnameTokenMistake(body = "") {
  return fixFirstnameToken(body) !== body;
}

function fixFirstnameToken(body = "") {
  const fixedBracketTokens = FIRSTNAME_BRACKET_TOKEN_MISTAKE_PATTERNS.reduce(
    (nextBody, pattern) => nextBody.replace(pattern, FIRSTNAME_TOKEN),
    body
  );

  return fixedBracketTokens.replace(
    FIRSTNAME_BARE_TOKEN_MISTAKE_PATTERN,
    (match, offset, fullText) => {
      const alreadyFixed =
        fullText[offset - 1] === "{" && fullText[offset + match.length] === "}";
      return alreadyFixed ? match : FIRSTNAME_TOKEN;
    }
  );
}

export default function MessagesStage({
  templates = initialTemplates,
  setTemplates,
  onNext,
  onPrev,
  stageNumLabel = "Stage 2 of 3",
  nextLabel = "Start messaging",
}) {

  const handleTitleChange = (id, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: value } : t))
    );
  };

  const handleBodyChange = (id, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, body: value } : t))
    );
  };

  const addTemplate = () => {
    const newTemplate = {
      id: `t${Date.now()}`,
      title: "New Template",
      body: "",
    };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const deleteTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };
  const fixTemplateToken = (id) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, body: fixFirstnameToken(t.body) } : t
      )
    );
  };
  const starterTemplateIds = new Set(
    initialTemplates.map((template) => template.id)
  );
  const hasStarterTemplates = templates.some((template) =>
    starterTemplateIds.has(template.id)
  );

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="WRITE YOUR MESSAGES"
      accentPhrase="MESSAGES"
      accentVariant={1}
      subtitle="Create the message templates you want to send to each contact."
      allowOverflow
    >
      <div className="glass-card" style={styles.container}>
        <div style={styles.tokenHelper}>
          <span style={styles.helperTitle}>Writing template messages</span>
          <span>
            Type <code style={styles.code}>{"{FIRSTNAME}"}</code> wherever you
            want Reachout to insert the contact's first name. For example,{" "}
            <code style={styles.code}>Hi {"{FIRSTNAME}"}</code> becomes{" "}
            <code style={styles.code}>Hi Sandy</code>.
          </span>
          <span>
            WhatsApp formatting can go straight into the template: surround
            words with asterisks to make them bold, like{" "}
            <code style={styles.code}>*this*</code>, or with underscores to make
            them italic, like <code style={styles.code}>_this_</code>. SMS and
            Signal will receive the same words without relying on the
            formatting.
          </span>
        </div>

        {hasStarterTemplates && (
          <div style={styles.exampleNotice}>
            Example templates are included to get you started. Edit or delete
            them before sending.
          </div>
        )}

        {/* Templates List */}
        <div style={styles.templatesGrid}>
          {templates.map((t) => {
            const showTokenFix = hasFirstnameTokenMistake(t.body);

            return (
              <div key={t.id} style={styles.card} className="glass-card">
                <div style={styles.cardHeader}>
                  <label style={styles.titleField}>
                    {starterTemplateIds.has(t.id) && (
                      <span style={styles.examplePill}>Example template</span>
                    )}
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => handleTitleChange(t.id, e.target.value)}
                      placeholder="Template title"
                      style={styles.titleInput}
                    />
                  </label>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    style={styles.deleteBtn}
                    title="Delete template"
                  >
                    <X size={16} color="var(--ta-red)" />
                  </button>
                </div>
                <textarea
                  value={t.body}
                  onChange={(e) => handleBodyChange(t.id, e.target.value)}
                  placeholder="Message body – use {FIRSTNAME} for personalization"
                  style={styles.bodyTextarea}
                />
                {showTokenFix && (
                  <div style={styles.tokenFixNotice}>
                    <span style={styles.tokenFixText}>
                      Did you mean to use{" "}
                      <code style={styles.inlineCode}>{FIRSTNAME_TOKEN}</code>?
                    </span>
                    <button
                      type="button"
                      onClick={() => fixTemplateToken(t.id)}
                      style={styles.tokenFixBtn}
                    >
                      <Check size={14} />
                      Fix token
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {/* Add new template card */}
          <div
            style={styles.addCard}
            className="glass-card"
            onClick={addTemplate}
          >
            <Plus size={32} color="var(--ta-green)" />
            <span style={styles.addLabel}>Add Template</span>
          </div>
        </div>

        <div style={styles.tipsBanner}>
          <div style={styles.infoIconWrapper}>
            <Info size={18} color="var(--ta-green)" />
          </div>
          <div style={styles.tipsTextContent}>
            <span style={styles.tipsTitle}>TOP TIP</span>
            <p style={styles.tipsText}>
              The Connolly for President campaign in Ireland found it useful to
              text people just before calling. A short message saying you are
              phonebanking now, and asking whether they are free for a call in
              the next hour, can make the follow-up call feel less cold.
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div style={styles.footerRow}>
          <button
            onClick={onPrev}
            style={styles.backBtn}
            className="hover-lift"
          >
            Back to contacts
          </button>

          <button
            onClick={onNext}
            style={styles.continueBtn}
            className="hover-lift"
          >
            <span>{nextLabel}</span> <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </StageShell>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "auto",
    minHeight: "100%",
  },
  templatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
    flex: "0 0 auto",
    overflow: "visible",
    paddingRight: 0,
  },
  tokenHelper: {
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    color: "var(--ta-muted-strong)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: "1.5",
    padding: "12px",
  },
  helperTitle: {
    color: "var(--ta-green)",
    fontWeight: 800,
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
  },
  exampleNotice: {
    marginTop: "-10px",
    color: "var(--ta-muted-strong)",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    minHeight: "200px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  titleField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: 0,
  },
  examplePill: {
    alignSelf: "flex-start",
    border: "1px solid color-mix(in srgb, var(--ta-red) 52%, transparent)",
    color: "var(--ta-red)",
    borderRadius: "999px",
    padding: "2px 6px",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(9px * var(--reachout-text-scale, 1))",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  titleInput: {
    width: "100%",
    background: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "6px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    outline: "none",
    padding: "7px 9px",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  bodyTextarea: {
    flex: 1,
    background: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    padding: "8px",
    borderRadius: "6px",
    resize: "vertical",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    minHeight: "80px",
    fontFamily: "var(--font-body)",
    outline: "none",
  },
  tokenFixNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    borderRadius: "8px",
    padding: "8px 10px",
  },
  tokenFixText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  inlineCode: {
    fontFamily: "var(--font-mono)",
    color: "var(--ta-cream)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
  },
  tokenFixBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    color: "var(--ta-green)",
    borderRadius: "7px",
    padding: "6px 9px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
  },
  addCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "20px",
  },
  addLabel: {
    marginTop: "8px",
    color: "var(--ta-green)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  tipsBanner: {
    display: "flex",
    backgroundColor: "var(--ta-gray-dark)",
    border: "1px solid rgba(79, 159, 104, 0.18)",
    borderRadius: "12px",
    padding: "16px",
    gap: "16px",
    alignItems: "center",
  },
  infoIconWrapper: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipsTextContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  tipsTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
  },
  tipsText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
    lineHeight: "1.5",
  },
  code: {
    fontFamily: "var(--font-mono)",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--ta-border-subtle)",
    paddingTop: "16px",
    marginTop: "auto",
  },
  backBtn: {
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-medium)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
  },
  continueBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "var(--border-glow)",
  },
};
