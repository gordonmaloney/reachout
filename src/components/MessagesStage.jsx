// src/components/MessagesStage.jsx
import { Info, X, Plus, ArrowRight } from "lucide-react";
import { initialTemplates } from "../data/mockData";
import StageShell from "./StageShell";


export default function MessagesStage({
  templates = initialTemplates,
  setTemplates,
  onNext,
  onPrev,
  stageNumLabel = "Stage 2 of 3",
  nextLabel = "START MESSAGING",
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

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="WRITE YOUR MESSAGES"
      accentPhrase="MESSAGES"
      accentVariant={1}
      subtitle="Create the message templates you want to send to each contact."
    >
      <div className="glass-card" style={styles.container}>
        <div style={styles.tokenHelper}>
          Use <code style={styles.code}>{"{FIRSTNAME}"}</code> to add each
          contact's first name. You can also use{" "}
          <code style={styles.code}>*bold*</code> and{" "}
          <code style={styles.code}>_italics_</code> for WhatsApp messages.
        </div>

        {/* Templates List */}
        <div style={styles.templatesGrid}>
          {templates.map((t) => (
            <div key={t.id} style={styles.card} className="glass-card">
              <div style={styles.cardHeader}>
                <label style={styles.titleField}>
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
            </div>
          ))}
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
              A tip from the Connolly for President campaign in Ireland: when
              starting a phonebanking session, consider texting contacts first
              to say you are calling people now and ask if they would be up for
              a chat in the next hour. That way they know to expect you!
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
    height: "100%",
    minHeight: 0,
  },
  templatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
    flex: 1,
    overflowY: "auto",
    paddingRight: "8px",
  },
  tokenHelper: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "rgba(247, 244, 236, 0.72)",
    fontSize: "12px",
    lineHeight: "1.5",
    padding: "10px 12px",
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
    minWidth: 0,
  },
  titleInput: {
    width: "100%",
    background: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "6px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "18px",
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
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--ta-cream)",
    padding: "8px",
    borderRadius: "6px",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "var(--font-body)",
    outline: "none",
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
    fontSize: "14px",
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
    fontSize: "15px",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
  },
  tipsText: {
    fontSize: "12px",
    color: "rgba(247, 244, 236, 0.75)",
    lineHeight: "1.5",
  },
  code: {
    fontFamily: "var(--font-mono)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    color: "var(--ta-cream)",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "16px",
    marginTop: "auto",
  },
  backBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(247,244,236,0.25)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "15px",
    fontWeight: "bold",
  },
  continueBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "12px 32px",
    fontFamily: "var(--font-heading)",
    fontSize: "18px",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "var(--border-glow)",
  },
};
