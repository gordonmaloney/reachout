import { useState } from "react";
import { Clipboard, FileText, ArrowRight, Check } from "lucide-react";
import StageShell from "./StageShell";
import ContactsPreview from "./ContactsPreview";
import { dialCodeOptions } from "../utils";

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
  const [isFocused, setIsFocused] = useState(false);

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

  const handlePasteEvent = (e) => {
    const text = e.clipboardData.getData("text");
    if (text) {
      const parsed = parsePasteText(text);
      if (parsed.length > 0) {
        setContacts([...contacts, ...parsed]);
        setErrorMsg("");
        setPasteOverlayText(`Imported ${parsed.length} contacts!`);
        setTimeout(() => setPasteOverlayText(""), 3000);
      } else {
        setErrorMsg(
          "Format unrecognized. Check formatting instructions below."
        );
        setTimeout(() => setErrorMsg(""), 4000);
      }
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
        const parsed = parsePasteText(text);
        if (parsed.length > 0) {
          setContacts([...contacts, ...parsed]);
          setErrorMsg("");
          setShowClipboardSuccess(true);
          setTimeout(() => setShowClipboardSuccess(false), 3000);
        } else {
          setErrorMsg(
            "Could not parse any contacts from clipboard. Check formatting below."
          );
          setTimeout(() => setErrorMsg(""), 4000);
        }
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
                <span>CLICK TO PASTE</span>
              </button>

              <span style={styles.clipboardHelper}>
                This button may request access to your clipboard to work.
              </span>

              {/* Floating alerts inside card */}
              {pasteOverlayText && (
                <div style={styles.successFloatingAlert}>
                  <Check size={16} />
                  <span>{pasteOverlayText}</span>
                </div>
              )}

              {showClipboardSuccess && (
                <div style={styles.successFloatingAlert}>
                  <Check size={16} />
                  <span>Contacts imported successfully!</span>
                </div>
              )}

              {errorMsg && (
                <div style={styles.errorFloatingAlert}>
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>

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
              <h3 style={styles.cardTitle}>
                CONTACTS PREVIEW{" "}
                <span style={styles.countBadge}>({contacts.length})</span>
              </h3>

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
                CLEAR ALL
              </button>
            </div>

            <ContactsPreview
              contacts={contacts}
              setContacts={setContacts}
              selectedDialCode={selectedDialCode}
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
    </StageShell>
  );
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
    alignItems: "center",
    borderBottom: "1px solid var(--ta-border-subtle)",
    paddingBottom: "14px",
    marginBottom: "14px",
    flexShrink: 0,
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
    padding: "12px 32px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
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
    bottom: "16px",
    backgroundColor: "var(--ta-gray-dark)",
    border: "1px solid var(--ta-green)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "6px 16px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    boxShadow: "var(--modal-card-shadow)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    zIndex: 20,
    pointerEvents: "none",
  },
  errorFloatingAlert: {
    position: "absolute",
    bottom: "16px",
    backgroundColor: "rgba(255, 77, 77, 0.15)",
    border: "1px solid var(--ta-red)",
    color: "var(--ta-red)",
    borderRadius: "8px",
    padding: "6px 16px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    zIndex: 20,
    pointerEvents: "none",
  },
};
