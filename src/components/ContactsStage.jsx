import { useState } from "react";
import { Clipboard, FileText, ArrowRight, Check, X } from "lucide-react";
import StageShell from "./StageShell";
import ContactsPreview from "./ContactsPreview";
import { dialCodeOptions, normalizePhoneNumber } from "../utils";
import { initialContacts } from "../data/mockData";

export default function ContactsStage({
  contacts,
  setContacts,
  selectedDialCode,
  setSelectedDialCode,
  stageNumLabel = "Stage 1 of 3",
  onNext,
}) {
  const [pasteOverlayText, setPasteOverlayText] = useState("");
  const [showClipboardSuccess, setShowClipboardSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const hasExampleContacts = contacts.some((contact) =>
    initialContacts.some((example) => example.id === contact.id)
  );

  const duplicateContactIds = getDuplicateContactIds(
    contacts,
    selectedDialCode
  );
  const duplicateCount = duplicateContactIds.size;

  const parsePasteText = (text) => {
    const lines = text.split("\n");
    const parsed = [];
    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Case 1: comma, tab, semicolon, or | separated
      const parts = cleanLine.split(/[,\t;|]+/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const phone = parts[1].trim();
        if (name && phone) {
          parsed.push({
            id: "c_" + Math.random().toString(36).substr(2, 9),
            name,
            phone,
          });
        }
      } else {
        // Case 2: space separates name and phone (e.g. "Sandy Mills +447712345678")
        const phoneMatch = cleanLine.match(/(\+?[\d\s-]{8,20})$/);
        if (phoneMatch) {
          const phone = phoneMatch[1].trim();
          const name = cleanLine
            .substring(0, cleanLine.length - phone.length)
            .trim();
          if (name && phone) {
            parsed.push({
              id: "c_" + Math.random().toString(36).substr(2, 9),
              name,
              phone,
            });
          }
        }
      }
    });
    return parsed;
  };

  const showImportSuccess = (count, mode) => {
    const modeLabel = mode === "replace" ? "Imported" : "Added";
    setPasteOverlayText(`${modeLabel} ${count} contacts!`);
    setShowClipboardSuccess(false);
    setTimeout(() => setPasteOverlayText(""), 3000);
  };

  const applyImportedContacts = (parsedContacts, mode) => {
    setContacts((currentContacts) =>
      mode === "replace"
        ? parsedContacts
        : [...currentContacts, ...parsedContacts]
    );
    setErrorMsg("");
    setShowFormattingHelp(false);
    setPendingImport(null);
    showImportSuccess(parsedContacts.length, mode);
  };

  const processParsedContacts = (parsed, source) => {
    if (parsed.length === 0) {
      setErrorMsg(
        source === "clipboard"
          ? "Could not parse any contacts from clipboard. Check formatting below."
          : "Format unrecognized. Check formatting instructions below."
      );
      setShowFormattingHelp(true);
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    if (contacts.length > 0) {
      setPendingImport({ contacts: parsed, source });
      setErrorMsg("");
      setShowFormattingHelp(false);
      return;
    }

    applyImportedContacts(parsed, "replace");
  };

  const handlePasteEvent = (e) => {
    const text = e.clipboardData.getData("text");
    if (text) {
      processParsedContacts(parsePasteText(text), "paste");
    }
  };

  // Alternative button triggers system clipboard access
  const handleClipboardClick = async () => {
    try {
      if (!navigator.clipboard) {
        alert("Clipboard API is not supported in this browser context.");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        processParsedContacts(parsePasteText(text), "clipboard");
      } else {
        setErrorMsg("Clipboard is empty.");
        setTimeout(() => setErrorMsg(""), 3000);
      }
    } catch {
      setErrorMsg(
        "Access denied. Please paste using Ctrl/Cmd + V inside the box."
      );
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const cleanDuplicateContacts = () => {
    const seen = new Set();

    setContacts((currentContacts) =>
      currentContacts.filter((contact) => {
        const key = getContactDuplicateKey(contact, selectedDialCode);

        // If we cannot confidently identify it, don't delete it.
        if (!key) return true;

        // Keep the first contact with this key.
        if (!seen.has(key)) {
          seen.add(key);
          return true;
        }

        // Remove only later contacts with the same key.
        return false;
      })
    );
  };

  const clearAllContacts = () => {
    if (contacts.length === 0) return;
    if (window.confirm("Are you sure you want to clear all contacts?")) {
      setContacts([]);
    }
  };

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="IMPORT YOUR CONTACTS"
      accentPhrase="CONTACTS"
      accentVariant={0}
      subtitle={
        <>
          Copy and paste in the names and numbers of the people you want to
          message.{" "}
          <a
            href="https://docs.google.com/spreadsheets/d/1jcet6pPEUg3Syk_jWPcZ-OlqkUbwUf_guV6gS5HwBgo/edit?gid=0#gid=0"
            target="_blank"
            rel="noreferrer"
            style={styles.exampleLink}
          >
            You can copy this example for formatting.
          </a>
        </>
      }
      allowOverflow
    >
      <div style={styles.contentGrid}>
        {/* Left Side: Paste Box Card */}
        <div style={styles.pasteColumn}>
          <div
            tabIndex={0}
            onPaste={handlePasteEvent}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              ...styles.pasteCard,
              ...(isFocused ? styles.pasteCardFocused : {}),
            }}
            className="glass-card"
          >
            <div style={styles.pasteContent}>
              <div style={styles.iconCircle}>
                <Clipboard size={32} color="var(--ta-green)" />
              </div>

              <h3 style={styles.pasteHeading}>PASTE YOUR CONTACTS HERE</h3>

              <p style={styles.pasteDesc}>
                Copy your contacts' names and numbers with{" "}
                <kbd style={styles.kbd}>ctrl/cmd + C</kbd>, then click here and
                paste them with <kbd style={styles.kbd}>ctrl/cmd + V</kbd>.
              </p>

              <div style={styles.divisorLineRow}>
                <span style={styles.line}></span>
                <span style={styles.or}>OR</span>
                <span style={styles.line}></span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClipboardClick();
                }}
                style={styles.clipboardBtn}
                className="hover-lift"
              >
                <FileText size={16} />
                <span>Click to paste</span>
              </button>

              <span style={styles.clipboardHelper}>
                This button may request access to your clipboard to work.
              </span>

              {/* Floating alerts inside card */}
              {pasteOverlayText && (
                <div style={styles.successFloatingAlert}>
                  <Check size={16} />
                  <span>{pasteOverlayText}</span>
                  <span
                    className="contacts-import-toast-progress"
                    aria-hidden="true"
                  />
                </div>
              )}

              {showClipboardSuccess && (
                <div style={styles.successFloatingAlert}>
                  <Check size={16} />
                  <span>Contacts imported successfully!</span>
                  <span
                    className="contacts-import-toast-progress"
                    aria-hidden="true"
                  />
                </div>
              )}

              {errorMsg && (
                <div style={styles.errorFloatingAlert}>
                  <span>{errorMsg}</span>
                  <span
                    className="contacts-import-toast-progress contacts-import-toast-progress-error"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          </div>

          {showFormattingHelp && (
            <div style={styles.formatGuide} className="glass-card">
              <div style={styles.formatGuideHeader}>
                <span style={styles.formatGuideTitle}>Formatting example</span>
                <span style={styles.formatGuideText}>
                  Use one contact per row, with a name and phone number in
                  separate columns.
                </span>
              </div>
              <div style={styles.mockSheet}>
                <div style={styles.mockSheetHeader}>Name</div>
                <div style={styles.mockSheetHeader}>Phone number</div>
                <div style={styles.mockSheetCell}>Sandy Mills</div>
                <div style={styles.mockSheetCell}>+44 7712 345678</div>
                <div style={styles.mockSheetCell}>Mia Benson</div>
                <div style={styles.mockSheetCell}>07712 345678</div>
              </div>
              <p style={styles.formatGuideHint}>
                Commas, tabs, semicolons, or spreadsheet columns are all fine.
              </p>
            </div>
          )}

          <div style={styles.dialCodePanel} className="glass-card">
            <div style={styles.dialCodeCopy}>
              <span style={styles.dialCodeTitle}>DIAL CODE</span>
              <p style={styles.dialCodeText}>
                Used when a number does not already include an international
                dial code.
              </p>
            </div>
            <select
              value={selectedDialCode}
              onChange={(e) => setSelectedDialCode(e.target.value)}
              style={styles.dialCodeSelect}
            >
              {dialCodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Preview Card */}
        <div style={styles.previewColumn}>
          <div style={styles.previewCard} className="glass-card">
            <div style={styles.previewHeader}>
              <div style={styles.previewTitleGroup}>
                <h3 style={styles.cardTitle}>
                  CONTACTS PREVIEW{" "}
                  <span style={styles.countBadge}>({contacts.length})</span>
                </h3>
                {hasExampleContacts && (
                  <span style={styles.examplePill}>
                    Example contacts loaded
                  </span>
                )}
              </div>

              <button
                onClick={clearAllContacts}
                style={{
                  ...styles.clearBtn,
                  color:
                    contacts.length > 0
                      ? "var(--ta-red)"
                      : "rgba(255, 77, 77, 0.35)",
                  cursor: contacts.length > 0 ? "pointer" : "not-allowed",
                }}
                disabled={contacts.length === 0}
              >
                Clear all
              </button>
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

            <ContactsPreview
              contacts={contacts}
              setContacts={setContacts}
              selectedDialCode={selectedDialCode}
              duplicateContactIds={duplicateContactIds}
            />
          </div>
        </div>
      </div>

      {/* Footer / Transition CTA */}
      <div style={styles.footerRow}>
        <button
          onClick={onNext}
          disabled={contacts.length === 0}
          style={{
            ...styles.continueBtn,
            ...(contacts.length === 0 ? styles.continueBtnDisabled : {}),
          }}
          className="hover-lift"
        >
          <span>Continue to messages</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {pendingImport && (
        <div style={styles.modalOverlay} role="presentation">
          <div
            style={styles.importModal}
            className="glass-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contacts-import-choice-title"
          >
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              style={styles.modalCloseBtn}
              aria-label="Cancel import"
            >
              <X size={18} />
            </button>
            <span style={styles.modalKicker}>Contacts already loaded</span>
            <h3 id="contacts-import-choice-title" style={styles.modalTitle}>
              Add these contacts or replace the current list?
            </h3>
            <p style={styles.modalText}>
              We found {pendingImport.contacts.length} contact
              {pendingImport.contacts.length === 1 ? "" : "s"} in what you
              pasted. Choose whether to add them to the existing{" "}
              {contacts.length}, or replace the list and start fresh.
            </p>
            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.replaceBtn}
                onClick={() =>
                  applyImportedContacts(pendingImport.contacts, "replace")
                }
              >
                Replace list
              </button>
              <button
                type="button"
                style={styles.addBtn}
                onClick={() =>
                  applyImportedContacts(pendingImport.contacts, "add")
                }
              >
                Add to list
              </button>
            </div>
          </div>
        </div>
      )}
    </StageShell>
  );
}

function getContactDuplicateKey(contact, selectedDialCode) {
  const normalizedPhone = normalizePhoneNumber(contact.phone, selectedDialCode);
  if (normalizedPhone) return normalizedPhone;
  return contact.name?.trim().toLowerCase() || "";
}

function getDuplicateContactIds(contacts, selectedDialCode) {
  const firstContactByKey = new Map();
  const duplicateIds = new Set();

  contacts.forEach((contact) => {
    const key = getContactDuplicateKey(contact, selectedDialCode);
    if (!key) return;

    if (firstContactByKey.has(key)) {
      duplicateIds.add(contact.id);
      return;
    }

    firstContactByKey.set(key, contact.id);
  });

  return duplicateIds;
}

const styles = {
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "32px",
    alignItems: "start",
    width: "100%",
    overflow: "visible",
  },
  pasteColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: 0,
    width: "100%",
    overflow: "visible",
  },
  pasteCard: {
    flex: "0 0 auto",
    minHeight: "340px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    border: "1.5px dashed var(--ta-border-medium)",
    outline: "none",
    transition: "all 0.25s ease",
  },
  pasteCardFocused: {
    borderColor: "var(--ta-green)",
    boxShadow: "var(--green-glow)",
    backgroundColor: "rgba(79, 159, 104, 0.03)",
  },
  pasteContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    zIndex: 1,
    width: "100%",
  },
  iconCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    border: "1.5px solid rgba(79, 159, 104, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  pasteHeading: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    letterSpacing: "0.05em",
    marginBottom: "10px",
  },
  pasteDesc: {
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted)",
    lineHeight: "1.5",
    maxWidth: "320px",
    marginBottom: "20px",
  },
  exampleLink: {
    color: "var(--ta-green)",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
    whiteSpace: "nowrap",
  },
  kbd: {
    display: "inline-block",
    fontFamily: "var(--font-mono)",
    backgroundColor: "var(--ta-gray-dark)",
    border: "1.5px solid rgba(79, 159, 104, 0.3)",
    color: "var(--ta-green)",
    padding: "1px 2px",
    borderRadius: "4px",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  divisorLineRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: "16px",
    marginBottom: "20px",
    maxWidth: "320px",
  },
  line: {
    flex: 1,
    height: "1px",
    backgroundColor: "var(--ta-border-subtle)",
  },
  or: {
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted)",
  },
  clipboardBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "10px 24px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    cursor: "pointer",
    position: "relative",
    zIndex: 10,
    marginBottom: "6px",
  },
  clipboardHelper: {
    fontSize: "calc(10.5px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted)",
  },
  formatGuide: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid rgba(211, 106, 88, 0.36)",
    borderRadius: "14px",
    padding: "14px",
  },
  formatGuideHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  formatGuideTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-red)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  formatGuideText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  mockSheet: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    overflow: "hidden",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
  },
  mockSheetHeader: {
    backgroundColor: "rgba(79, 159, 104, 0.12)",
    borderBottom: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(10.5px * var(--reachout-text-scale, 1))",
    padding: "7px 8px",
  },
  mockSheetCell: {
    borderTop: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    padding: "7px 8px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  formatGuideHint: {
    color: "var(--ta-muted)",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  previewColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minWidth: 0,
    width: "100%",
    overflow: "visible",
  },
  previewCard: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    border: "1px solid var(--ta-border-medium)",
    borderRadius: "18px",
    height: "clamp(320px, 48vh, 420px)",
    minHeight: 0,
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    borderBottom: "1px solid var(--ta-border-subtle)",
    paddingBottom: "14px",
    marginBottom: "14px",
    flexShrink: 0,
  },
  duplicateNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "color-mix(in srgb, var(--ta-red) 12%, transparent)",
    border: "1px solid color-mix(in srgb, var(--ta-red) 52%, transparent)",
    borderRadius: "12px",
    padding: "10px 12px",
    marginBottom: "12px",
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
    fontFamily: "var(--font-heading)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.04em",
  },
  duplicateText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  cleanDuplicatesBtn: {
    flexShrink: 0,
    border: "1px solid color-mix(in srgb, var(--ta-red) 62%, transparent)",
    backgroundColor: "var(--ta-dark-2)",
    color: "var(--ta-red)",
    borderRadius: "8px",
    padding: "7px 10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
  previewTitleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    letterSpacing: "0.05em",
  },
  countBadge: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
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
  clearBtn: {
    backgroundColor: "transparent",
    border: "none",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  dialCodePanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexShrink: 0,
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 4%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "14px",
    padding: "14px 16px",
  },
  dialCodeCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  dialCodeTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
  },
  dialCodeText: {
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted)",
    lineHeight: "1.35",
  },
  dialCodeSelect: {
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-body)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    padding: "8px 10px",
    minWidth: "160px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "flex-end",
    borderTop: "1px solid var(--ta-border-subtle)",
    paddingTop: "20px",
    marginTop: 0,
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
  continueBtnDisabled: {
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    color: "color-mix(in srgb, var(--ta-cream) 32%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  successFloatingAlert: {
    position: "absolute",
    left: "50%",
    bottom: "22px",
    transform: "translateX(-50%)",
    width: "min(calc(100% - 32px), 360px)",
    backgroundColor: "var(--ta-gray-dark)",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-green)",
    borderRadius: "12px",
    padding: "14px 18px 16px",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    boxShadow: "var(--modal-card-shadow)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    zIndex: 20,
    overflow: "hidden",
    pointerEvents: "none",
  },
  errorFloatingAlert: {
    position: "absolute",
    left: "50%",
    bottom: "22px",
    transform: "translateX(-50%)",
    width: "min(calc(100% - 32px), 380px)",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid var(--ta-red)",
    color: "var(--ta-red)",
    borderRadius: "12px",
    padding: "14px 18px 16px",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    boxShadow: "var(--modal-card-shadow)",
    zIndex: 20,
    overflow: "hidden",
    pointerEvents: "none",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  importModal: {
    position: "relative",
    width: "min(100%, 460px)",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid var(--ta-border-medium)",
    borderRadius: "18px",
    boxShadow: "var(--modal-card-shadow)",
    padding: "24px",
  },
  modalCloseBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    border: "1px solid var(--ta-border-subtle)",
    backgroundColor: "transparent",
    color: "var(--ta-muted)",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modalKicker: {
    display: "block",
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  modalTitle: {
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(25px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.04em",
    lineHeight: 1.05,
    paddingRight: "34px",
    marginBottom: "10px",
  },
  modalText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.5,
    marginBottom: "18px",
  },
  modalActions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  replaceBtn: {
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 5%, transparent)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "11px 12px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
  addBtn: {
    border: "1px solid var(--ta-green)",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "11px 12px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
};
