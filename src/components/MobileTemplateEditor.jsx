import { Moon, Plus, Sun, X } from "lucide-react";
import { useState } from "react";

export default function MobileTemplateEditor({
  templates,
  setTemplates,
  extraChannelsEnabled,
  setExtraChannelsEnabled,
  theme = "dark",
  onToggleTheme = () => {},
}) {
  const [showChannelModal, setShowChannelModal] = useState(false);
  const nextTheme = theme === "dark" ? "light" : "dark";

  const handleChange = (id, field, value) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTemplate = () => {
    setTemplates((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        title: "New Template",
        body: "",
      },
    ]);
  };

  const handleRemoveTemplate = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const enableExtraChannels = () => {
    setExtraChannelsEnabled(true);
    setShowChannelModal(false);
  };
  const handleChannelToggle = () => {
    if (extraChannelsEnabled) {
      setExtraChannelsEnabled(false);
      return;
    }
    setShowChannelModal(true);
  };

  return (
    <div style={styles.container} className="glass-card">
      <div style={styles.header}>
        <h2 style={styles.title}>Edit Templates</h2>
        <button onClick={handleAddTemplate} style={styles.addBtn} className="hover-lift">
          <Plus size={16} /> Add
        </button>
      </div>
      <div style={styles.displayRow}>
        <div>
          <span style={styles.displayTitle}>Display</span>
          <p style={styles.displayText}>Switch colour mode for this phone.</p>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          style={styles.themeBtn}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
      <button onClick={handleChannelToggle} style={styles.channelBtn} className="hover-lift">
        {extraChannelsEnabled ? "Signal / Telegram enabled" : "Add Signal / Telegram"}
      </button>
      <div style={styles.list} className="mobile-template-list">
        {templates.map((t) => (
          <div key={t.id} style={styles.item} className="glass-card">
            <div style={styles.templateHeader}>
              <input
                style={styles.input}
                type="text"
                value={t.title}
                onChange={(e) => handleChange(t.id, "title", e.target.value)}
              />
              <button
                onClick={() => handleRemoveTemplate(t.id)}
                style={styles.removeBtn}
                title="Remove template"
              >
                <X size={16} color="var(--ta-red)" />
              </button>
            </div>
            <textarea
              className="mobile-template-body"
              style={styles.textarea}
              rows={5}
              value={t.body}
              onChange={(e) => handleChange(t.id, "body", e.target.value)}
            />
          </div>
        ))}
      </div>
      {showChannelModal && (
        <div style={styles.modalOverlay} onClick={() => setShowChannelModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add Signal and Telegram</h3>
            <p style={styles.modalText}>
              This adds Signal and Telegram as contact options. Signal does not
              allow pre-filled messages, so tapping Signal will copy the
              message to your clipboard and open the chat with the contact.
            </p>
            <p style={styles.modalText}>
              Telegram will open the contact by phone number where supported by the app.
            </p>
            <div style={styles.modalActions}>
              <button onClick={() => setShowChannelModal(false)} style={styles.modalSecondary}>Cancel</button>
              <button onClick={enableExtraChannels} style={styles.modalPrimary}>Enable</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "var(--ta-cream)",
    minHeight: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    margin: 0,
    color: "var(--ta-green)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    flex: 1,
  },
  displayRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "10px 12px",
  },
  displayTitle: {
    display: "block",
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    marginBottom: "1px",
  },
  displayText: {
    color: "var(--ta-muted)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    lineHeight: 1.3,
    margin: 0,
  },
  themeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "transparent",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "999px",
    padding: "7px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    flexShrink: 0,
  },
  item: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
  },
  templateHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-heading)",
  },
  textarea: {
    background: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-cream)",
    padding: "4px 8px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    minHeight: "128px",
    resize: "none",
  },
  addBtn: {
    backgroundColor: "transparent",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "6px",
    padding: "6px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  channelBtn: {
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    color: "var(--ta-green)",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    cursor: "pointer",
  },
  removeBtn: {
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "transparent",
    border: "1px solid rgba(255, 77, 77, 0.4)",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "18px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "360px",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "12px",
    padding: "18px",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
  },
  modalTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    marginBottom: "8px",
  },
  modalText: {
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    color: "var(--ta-muted-strong)",
    marginBottom: "10px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "14px",
  },
  modalSecondary: {
    background: "transparent",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 12px",
  },
  modalPrimary: {
    background: "var(--ta-green)",
    border: "none",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontFamily: "var(--font-heading)",
  },
};
