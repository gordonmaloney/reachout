import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Check,
  Clipboard,
  Edit2,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  generateCallLink,
  generateSignalLink,
  generateSmsLink,
  generateTelegramLink,
  generateWhatsAppLink,
  getDuplicateContactIds,
  getOutboundMessage,
  normalizePhoneNumber,
  removeDuplicateContacts,
} from "../utils";

function WhatsAppMark({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12.04 3.5a8.43 8.43 0 0 0-7.18 12.85l-.87 3.15 3.24-.85a8.42 8.42 0 1 0 4.81-15.15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 8.15c.2-.43.38-.44.56-.44h.48c.16 0 .38.06.58.49.2.48.66 1.58.72 1.7.06.12.1.27.02.43-.1.18-.16.27-.31.43l-.24.26c-.11.11-.23.23-.1.47.13.24.58.95 1.24 1.54.85.75 1.56.99 1.8 1.1.23.12.37.1.5-.06.16-.18.58-.67.73-.9.16-.23.31-.2.52-.12.22.08 1.38.65 1.62.77.24.12.4.18.46.28.06.1.06.6-.14 1.17-.2.57-1.17 1.08-1.63 1.12-.42.04-.95.06-1.54-.1-.36-.1-.82-.26-1.41-.52-2.48-1.07-4.1-3.56-4.22-3.73-.12-.17-1-1.33-1-2.54 0-1.2.63-1.8.86-2.05Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function MobileContactsManager({
  contacts,
  setContacts,
  templates = [],
  selectedDialCode,
  extraChannelsEnabled = false,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [copiedSignalId, setCopiedSignalId] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const templateList =
    templates.length > 0
      ? templates
      : [{ id: "__blank__", title: "Message contact", body: "" }];
  const duplicateContactIds = getDuplicateContactIds(
    contacts,
    selectedDialCode
  );
  const duplicateCount = duplicateContactIds.size;

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  };

  const saveEdit = (id) => {
    if (!editName.trim() || !editPhone.trim()) return;

    setContacts((currentContacts) =>
      currentContacts.map((contact) =>
        contact.id === id
          ? { ...contact, name: editName.trim(), phone: editPhone.trim() }
          : contact
      )
    );
    cancelEdit();
  };

  const deleteContact = (id) => {
    setContacts((currentContacts) =>
      currentContacts.filter((contact) => contact.id !== id)
    );
    if (editingId === id) {
      cancelEdit();
    }
  };

  const showImportMessage = (message) => {
    setImportMessage(message);
    window.setTimeout(() => setImportMessage(""), 3000);
  };

  const showImportError = (message) => {
    setImportError(message);
    window.setTimeout(() => setImportError(""), 4000);
  };

  const applyImportedContacts = (parsedContacts, mode) => {
    setContacts((currentContacts) =>
      mode === "replace"
        ? parsedContacts
        : [...currentContacts, ...parsedContacts]
    );
    setPendingImport(null);
    setImportError("");
    showImportMessage(
      `${mode === "replace" ? "Imported" : "Added"} ${
        parsedContacts.length
      } contacts`
    );
  };

  const processParsedContacts = (parsedContacts) => {
    if (parsedContacts.length === 0) {
      showImportError(
        "Could not parse any contacts. Use one name and phone number per row."
      );
      return;
    }

    if (contacts.length > 0) {
      setPendingImport({ contacts: parsedContacts });
      setImportError("");
      return;
    }

    applyImportedContacts(parsedContacts, "replace");
  };

  const handleClipboardPaste = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        showImportError("Clipboard paste is not available in this browser.");
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showImportError("Clipboard is empty.");
        return;
      }

      processParsedContacts(parsePasteText(text));
    } catch {
      showImportError("Clipboard access was blocked. Try copying again first.");
    }
  };

  const cleanDuplicateContacts = () => {
    setContacts((currentContacts) =>
      removeDuplicateContacts(currentContacts, selectedDialCode)
    );
  };

  const copySignalMessage = async (contact, template) => {
    const message = getOutboundMessage(contact, template, {
      plainText: true,
    }).trim();
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      const copiedId = `${contact.id}:${template.id}`;
      setCopiedSignalId(copiedId);
      window.setTimeout(() => {
        setCopiedSignalId((current) => (current === copiedId ? "" : current));
      }, 1600);
    } catch {
      // Signal cannot receive prefilled text, so copying is the best fallback.
    }
  };

  return (
    <div style={styles.card} className="glass-card">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Contacts</h2>
          <p style={styles.subtitle}>
            Browse, edit or remove contacts before you start phonebanking.
          </p>
        </div>
        <span style={styles.count}>{contacts.length}</span>
      </div>

      <div style={styles.importPanel}>
        <button
          type="button"
          onClick={() => setIsImportOpen((current) => !current)}
          style={styles.importToggle}
          aria-expanded={isImportOpen}
        >
          <span style={styles.importToggleCopy}>
            <Clipboard size={14} />
            Paste contacts
          </span>
          <ChevronDown
            size={15}
            style={{
              transform: isImportOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          />
        </button>
        {isImportOpen && (
          <div style={styles.importBody}>
            <p style={styles.importText}>
              Copy contacts from a spreadsheet, then tap paste. Use one contact
              per row with name and phone number.
            </p>
            <button
              type="button"
              onClick={handleClipboardPaste}
              style={styles.pasteBtn}
            >
              <Clipboard size={14} /> Paste from clipboard
            </button>
            <span style={styles.importHint}>
              Commas, tabs, semicolons and spreadsheet columns all work.
            </span>
            {importMessage && (
              <div style={styles.importSuccess}>
                <Check size={14} />
                <span>{importMessage}</span>
              </div>
            )}
            {importError && (
              <div style={styles.importError}>
                <AlertTriangle size={14} />
                <span>{importError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {duplicateCount > 0 && (
        <div style={styles.duplicateNotice}>
          <div style={styles.duplicateCopy}>
            <span style={styles.duplicateTitle}>
              {duplicateCount} duplicate{" "}
              {duplicateCount === 1 ? "contact" : "contacts"} found
            </span>
            <span style={styles.duplicateText}>
              Matching phone numbers are highlighted below.
            </span>
          </div>
          <button
            type="button"
            onClick={cleanDuplicateContacts}
            style={styles.cleanDuplicatesBtn}
          >
            Clean up
          </button>
        </div>
      )}

      <div style={styles.list}>
        {contacts.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyTitle}>No contacts loaded</span>
            <span style={styles.emptyText}>
              Paste contacts here or use Scan data to import a list.
            </span>
          </div>
        ) : (
          contacts.map((contact) => {
            const isEditing = editingId === contact.id;
            const isDuplicate = duplicateContactIds.has(contact.id);

            return (
              <div
                key={contact.id}
                style={{
                  ...styles.row,
                  ...(isDuplicate ? styles.duplicateRow : {}),
                }}
              >
                <div style={styles.rowTop}>
                  {!isEditing && (
                    <a
                      href={generateCallLink(contact, selectedDialCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Call ${contact.name}`}
                      title={`Call ${contact.name}`}
                      style={{ ...styles.iconBtn, ...styles.callHeaderBtn }}
                    >
                      <Phone size={15} />
                    </a>
                  )}
                  <div style={styles.contactMain}>
                    {isEditing ? (
                      <div style={styles.editFields}>
                        <input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          placeholder="Name"
                          style={styles.input}
                        />
                        <input
                          value={editPhone}
                          onChange={(event) => setEditPhone(event.target.value)}
                          placeholder="Phone"
                          type="tel"
                          style={styles.input}
                        />
                      </div>
                    ) : (
                      <>
                        <span style={styles.name}>
                          {contact.name}
                          {isDuplicate && (
                            <span style={styles.duplicateLabel}>
                              Duplicate
                            </span>
                          )}
                        </span>
                        <span style={styles.phone}>
                          {normalizePhoneNumber(contact.phone, selectedDialCode)}
                        </span>
                      </>
                    )}
                  </div>
                  <div style={styles.actions}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(contact.id)}
                          style={styles.saveBtn}
                          aria-label="Save contact"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={styles.iconBtn}
                          aria-label="Cancel editing"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(contact)}
                          style={styles.iconBtn}
                          aria-label={`Edit ${contact.name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteContact(contact.id)}
                          style={styles.deleteBtn}
                          aria-label={`Delete ${contact.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <div style={styles.contactActions}>
                    {templateList.map((template) => {
                      const copiedId = `${contact.id}:${template.id}`;
                      const hasMessageText = getOutboundMessage(
                        contact,
                        template,
                        { plainText: true }
                      ).trim();

                      return (
                        <div key={template.id} style={styles.messageGroup}>
                          <span style={styles.templateTitle}>
                            {template.title ? <>{template.title}:</> : <i>No template:</i>}
                          </span>
                          <div style={styles.messageActions}>
                            <a
                              href={generateWhatsAppLink(
                                contact,
                                template,
                                selectedDialCode
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`WhatsApp ${contact.name}: ${template.title}`}
                              title={`WhatsApp: ${template.title}`}
                              style={styles.contactActionBtn}
                            >
                              <WhatsAppMark />
                            </a>
                            <a
                              href={generateSmsLink(
                                contact,
                                template,
                                selectedDialCode
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`SMS ${contact.name}: ${template.title}`}
                              title={`SMS: ${template.title}`}
                              style={styles.contactActionBtn}
                            >
                              <MessageSquare size={13} />
                            </a>
                            {extraChannelsEnabled && (
                              <>
                                <a
                                  href={generateSignalLink(
                                    contact,
                                    selectedDialCode
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={
                                    hasMessageText
                                      ? () =>
                                          copySignalMessage(contact, template)
                                      : undefined
                                  }
                                  aria-label={`Signal ${contact.name}: ${template.title}`}
                                  title={`Signal: ${template.title}`}
                                  style={styles.contactActionBtn}
                                >
                                  {copiedSignalId === copiedId ? (
                                    <Check size={13} />
                                  ) : (
                                    <MessageCircle size={13} />
                                  )}
                                </a>
                                <a
                                  href={generateTelegramLink(
                                    contact,
                                    selectedDialCode
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Telegram ${contact.name}`}
                                  title="Telegram"
                                  style={styles.contactActionBtn}
                                >
                                  <Send size={13} />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {pendingImport && (
        <div style={styles.modalOverlay} role="presentation">
          <div
            style={styles.importModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-contacts-import-title"
          >
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              style={styles.modalCloseBtn}
              aria-label="Cancel import"
            >
              <X size={17} />
            </button>
            <span style={styles.modalKicker}>Contacts already loaded</span>
            <h3 id="mobile-contacts-import-title" style={styles.modalTitle}>
              Add these contacts or replace the current list?
            </h3>
            <p style={styles.modalText}>
              We found {pendingImport.contacts.length} contact
              {pendingImport.contacts.length === 1 ? "" : "s"} in your
              clipboard. Add them to the existing {contacts.length}, or replace
              the list and start fresh.
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() =>
                  applyImportedContacts(pendingImport.contacts, "replace")
                }
                style={styles.replaceBtn}
              >
                Replace list
              </button>
              <button
                type="button"
                onClick={() =>
                  applyImportedContacts(pendingImport.contacts, "add")
                }
                style={styles.addBtn}
              >
                Add to list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parsePasteText(text) {
  const lines = text.split("\n");
  const parsed = [];

  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    const parts = cleanLine.split(/[,\t;|]+/);
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const phone = parts[1].trim();
      if (name && phone) {
        parsed.push({
          id: `c_${Math.random().toString(36).substr(2, 9)}`,
          name,
          phone,
        });
      }
      return;
    }

    const phoneMatch = cleanLine.match(/(\+?[\d\s-]{8,20})$/);
    if (!phoneMatch) return;

    const phone = phoneMatch[1].trim();
    const name = cleanLine.substring(0, cleanLine.length - phone.length).trim();
    if (name && phone) {
      parsed.push({
        id: `c_${Math.random().toString(36).substr(2, 9)}`,
        name,
        phone,
      });
    }
  });

  return parsed;
}

const styles = {
  card: {
    height: "100%",
    minHeight: 0,
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "var(--ta-cream)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexShrink: 0,
  },
  title: {
    color: "var(--ta-green)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    lineHeight: 1,
    margin: 0,
  },
  subtitle: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
    marginTop: "3px",
  },
  count: {
    minWidth: "32px",
    height: "32px",
    borderRadius: "999px",
    border: "1px solid rgba(79, 159, 104, 0.34)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    flexShrink: 0,
  },
  importPanel: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    overflow: "hidden",
    flexShrink: 0,
  },
  importToggle: {
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
  importToggleCopy: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "var(--ta-green)",
  },
  importBody: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "0 10px 10px",
  },
  importText: {
    margin: 0,
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  pasteBtn: {
    minHeight: "34px",
    border: "1px solid rgba(79, 159, 104, 0.48)",
    borderRadius: "999px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "8px 12px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
  importHint: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    lineHeight: 1.3,
  },
  importSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: "1px solid rgba(79, 159, 104, 0.4)",
    borderRadius: "8px",
    backgroundColor: "rgba(79, 159, 104, 0.13)",
    color: "var(--ta-green)",
    padding: "8px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  importError: {
    display: "flex",
    alignItems: "flex-start",
    gap: "7px",
    border: "1px solid rgba(211, 106, 88, 0.38)",
    borderRadius: "8px",
    backgroundColor: "rgba(211, 106, 88, 0.12)",
    color: "var(--ta-red)",
    padding: "8px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.3,
  },
  duplicateNotice: {
    border: "1px solid rgba(211, 106, 88, 0.36)",
    borderRadius: "10px",
    backgroundColor: "rgba(211, 106, 88, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px",
    flexShrink: 0,
  },
  duplicateCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  duplicateTitle: {
    color: "var(--ta-red)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
  duplicateText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    lineHeight: 1.25,
  },
  cleanDuplicatesBtn: {
    border: "1px solid rgba(211, 106, 88, 0.42)",
    borderRadius: "999px",
    backgroundColor: "rgba(211, 106, 88, 0.13)",
    color: "var(--ta-red)",
    padding: "7px 9px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    minHeight: 0,
    paddingRight: "4px",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "10px",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "10px",
  },
  duplicateRow: {
    borderColor: "rgba(211, 106, 88, 0.48)",
    backgroundColor: "rgba(211, 106, 88, 0.1)",
  },
  rowTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  contactMain: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  name: {
    color: "var(--ta-cream)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  duplicateLabel: {
    border: "1px solid rgba(211, 106, 88, 0.4)",
    borderRadius: "999px",
    color: "var(--ta-red)",
    padding: "2px 5px",
    fontSize: "calc(9px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
    lineHeight: 1,
    flexShrink: 0,
  },
  phone: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  editFields: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  input: {
    width: "100%",
    minWidth: 0,
    backgroundColor: "var(--surface-subtle)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-body)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    padding: "8px",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flexShrink: 0,
  },
  iconBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid var(--ta-border-subtle)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    backgroundColor: "rgba(79, 159, 104, 0.16)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid rgba(211, 106, 88, 0.34)",
    backgroundColor: "transparent",
    color: "var(--ta-red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  contactActions: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    paddingTop: "8px",
    borderTop: "1px solid var(--ta-border-subtle)",
  },
  callHeaderBtn: {
    backgroundColor: "var(--ta-green)",
    borderColor: "var(--ta-green)",
    color: "var(--ta-dark)",
  },
  messageGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    minWidth: 0,
  },
  templateTitle: {
    flex: 1,
    minWidth: 0,
    color: "var(--ta-cream)",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  messageActions: {
    display: "flex",
    flexWrap: "nowrap",
    gap: "5px",
    flexShrink: 0,
  },
  contactActionBtn: {
    width: "30px",
    height: "30px",
    minHeight: "30px",
    borderRadius: "999px",
    border: "1px solid var(--ta-border-subtle)",
    backgroundColor: "color-mix(in srgb, var(--ta-green) 8%, transparent)",
    color: "var(--ta-cream)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    fontFamily: "var(--font-body)",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    letterSpacing: "0.01em",
    lineHeight: 1.1,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  empty: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  emptyTitle: {
    color: "var(--ta-cream)",
    fontWeight: 700,
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  emptyText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
  },
  importModal: {
    position: "relative",
    width: "100%",
    maxWidth: "360px",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "14px",
    backgroundColor: "var(--modal-card-bg)",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
    padding: "18px",
  },
  modalCloseBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    border: "1px solid var(--ta-border-subtle)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalKicker: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(10px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  modalTitle: {
    margin: "7px 28px 8px 0",
    color: "var(--ta-cream)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    lineHeight: 1.05,
  },
  modalText: {
    margin: 0,
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  modalActions: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  },
  replaceBtn: {
    flex: 1,
    border: "1px solid rgba(211, 106, 88, 0.4)",
    borderRadius: "999px",
    backgroundColor: "transparent",
    color: "var(--ta-red)",
    padding: "9px 10px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
  addBtn: {
    flex: 1,
    border: "1px solid var(--ta-green)",
    borderRadius: "999px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    padding: "9px 10px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
};
