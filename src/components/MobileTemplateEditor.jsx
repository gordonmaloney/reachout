import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function MobileTemplateEditor({ templates, setTemplates, extraChannelsEnabled, setExtraChannelsEnabled }) {
  const [showChannelModal, setShowChannelModal] = useState(false);

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
              This adds Signal and Telegram buttons to each contact card. Signal does not allow pre-filled messages, so tapping Signal will copy the message to your clipboard and open the chat with the contact's number.
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
    fontSize: "20px",
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
    fontSize: "14px",
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
    fontSize: "13px",
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
    fontSize: "14px",
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
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "18px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "360px",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "12px",
    padding: "18px",
    color: "var(--ta-cream)",
  },
  modalTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "20px",
    color: "var(--ta-green)",
    marginBottom: "8px",
  },
  modalText: {
    fontSize: "13px",
    lineHeight: 1.45,
    color: "rgba(247,244,236,0.72)",
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
    border: "1px solid rgba(247,244,236,0.25)",
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
