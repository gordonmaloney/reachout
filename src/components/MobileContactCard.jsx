import { useState } from "react";
import Links from "./Links";
import { Check, Contact, Copy, Phone, X} from "lucide-react";
import { generateCallLink, normalizePhoneNumber } from "../utils";

const callButtonStyle = {
  backgroundColor: "var(--ta-green)",
  border: "1px solid var(--ta-green)",
  color: "var(--ta-dark)",
  borderRadius: "12px",
  padding: "11px 15px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-heading)",
  fontSize: "calc(17px * var(--reachout-text-scale, 1))",
  cursor: "pointer",
  textDecoration: "none",
  flexShrink: 0,
  minWidth: "84px",
  justifyContent: "center",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.24)",
};

export default function MobileContactCard({
  contact,
  templates,
  selectedDialCode,
  extraChannelsEnabled,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  report = null,
  setReport = () => {},
  reportBackRequired = false,
  reportBackBlockMessage = "",
  blockedQuestionIds = [],
  showReportBackTooltip = false,
}) {
  const templateList =
    templates.length > 0
      ? templates
      : [{ id: "__blank__", title: "Message contact", body: "" }];
  const callLink = generateCallLink(contact, selectedDialCode);
  const previewPhone = normalizePhoneNumber(contact.phone, selectedDialCode);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const isReporting = Boolean(report?.contacted);
  const reportEnabled = Boolean(reportBackSettings.enabled);
  const reportQuestions =
    reportBackSettings.questions?.filter((question) =>
      question.label?.trim()
    ) || [];

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(previewPhone);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 1600);
    } catch {
      // Clipboard can be unavailable in some browsers.
    }
  };

  const startReport = () => {
    setReport({
      contacted: true,
      answers: {},
      date: new Date().toISOString(),
    });
  };

  const updateReport = (patch) => {
    setReport({
      contacted: true,
      answers: report?.answers || {},
      date: report?.date || new Date().toISOString(),
      ...patch,
    });
  };

    const undoContacted = () => {
      setReport({
        contacted: false
      });
    };


  const updateAnswer = (questionId, answer) => {
    updateReport({
      answers: {
        ...(report?.answers || {}),
        [questionId]: answer,
      },
    });
  };

  return (
    <div style={styles.card} className="glass-card">
      <div style={styles.header}>
        <div style={styles.avatar}>
          <Contact size={18} />
        </div>
        <div style={styles.contactText}>
          <div style={styles.name}>{contact.name}</div>
          <button
            type="button"
            onClick={copyPhoneNumber}
            style={styles.phone}
            className="hover-lift"
          >
            {copiedPhone ? <Check size={13} /> : <Copy size={13} />}
            <span>{previewPhone}</span>
          </button>
        </div>
        {!isReporting && (
          <a
            href={callLink}
            target="_blank"
            rel="noopener noreferrer"
            style={callButtonStyle}
            className="hover-lift"
          >
            <Phone size={14} /> Call
          </a>
        )}
      </div>
      <div style={styles.scrollShell}>
        <div style={styles.scrollBody} className="mobile-card-scroll">
          {isReporting ? (
            <div style={styles.reportForm}>
              <button
                onClick={() => undoContacted()}
                style={styles.iconBtn}
                title="Close"
              >
                <X size={18} />
              </button>

              <span style={styles.reportTitle}>Contact report</span>
              {reportBackRequired && (
                <span style={styles.requiredHint}>
                  Required before moving on
                </span>
              )}
              {reportBackBlockMessage && isReporting && (
                <div style={styles.reportBlockMessage}>
                  {reportBackBlockMessage}
                </div>
              )}
              {reportQuestions.map((question) => {
                const isBlockedQuestion = blockedQuestionIds.includes(
                  question.id
                );

                return question.type === "yes_no" ? (
                  <div
                    key={question.id}
                    style={{
                      ...styles.questionBlock,
                      ...(isBlockedQuestion ? styles.questionBlockError : {}),
                    }}
                  >
                    <span style={styles.question}>
                      {question.label}
                      {reportBackRequired && question.mandatory ? (
                        <span style={styles.requiredMark}> *</span>
                      ) : null}
                    </span>
                    <div style={styles.answerRow}>
                      <button
                        type="button"
                        onClick={() => updateAnswer(question.id, "yes")}
                        style={{
                          ...styles.answerBtn,
                          ...(report?.answers?.[question.id] === "yes"
                            ? styles.answerBtnActive
                            : {}),
                          ...(isBlockedQuestion ? styles.answerBtnError : {}),
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAnswer(question.id, "no")}
                        style={{
                          ...styles.answerBtn,
                          ...(report?.answers?.[question.id] === "no"
                            ? styles.answerBtnActive
                            : {}),
                          ...(isBlockedQuestion ? styles.answerBtnError : {}),
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    key={question.id}
                    style={{
                      ...styles.notesLabel,
                      ...(isBlockedQuestion ? styles.questionBlockError : {}),
                    }}
                  >
                    <span>
                      {question.label}
                      {reportBackRequired && question.mandatory ? (
                        <span style={styles.requiredMark}> *</span>
                      ) : null}
                    </span>
                    <textarea
                      value={report?.answers?.[question.id] || ""}
                      onChange={(event) =>
                        updateAnswer(question.id, event.target.value)
                      }
                      placeholder="Note anything worth following up here"
                      style={{
                        ...styles.notesInput,
                        ...(isBlockedQuestion ? styles.notesInputError : {}),
                      }}
                    />
                  </label>
                );
              })}
              {reportQuestions.length === 0 && (
                <span style={styles.question}>
                  No reportback questions set.
                </span>
              )}
            </div>
          ) : (
            callNotes.filter((note) => note.text?.trim()).length > 0 && (
              <div style={styles.callNotesBlock}>
                <span style={styles.callNotesTitle}>
                  Talking point reminders:
                </span>
                <ul style={styles.callNotesList}>
                  {callNotes
                    .filter((note) => note.text?.trim())
                    .map((note) => (
                      <li key={note.id}>{note.text}</li>
                    ))}
                </ul>
              </div>
            )
          )}
          {!isReporting && (
            <div style={styles.templates}>
              {templateList.map((t) => (
                <div key={t.id} style={styles.templateBlock}>
                  <Links
                    contact={contact}
                    template={t}
                    dialCode={selectedDialCode}
                    extraChannelsEnabled={extraChannelsEnabled}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {reportEnabled && !isReporting && (
        <div style={styles.reportAction}>
          {showReportBackTooltip && (
            <div style={styles.reportTooltip}>
              Use this to record what happened after this contact. Your answers
              will be included in the report at the end.
            </div>
          )}
          <button
            type="button"
            onClick={startReport}
            style={{
              ...styles.contactedBtn,
              ...(reportBackBlockMessage ? styles.contactedBtnError : {}),
            }}
          >
            {reportBackRequired ? "Report back -  required" : "Report back"}
          </button>
          {reportBackBlockMessage && (
            <div style={styles.reportBlockMessage}>
              {reportBackBlockMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    height: "100%",
    maxHeight: "100%",
    minHeight: 0,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.12)",
    border: "1px solid rgba(79, 159, 104, 0.35)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contactText: {
    flex: 1,
    minWidth: 0,
  },
  iconBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    zIndex: 2,
    width: "34px",
    height: "34px",
    background: "transparent",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-heading)",
    lineHeight: 1,
  },
  phone: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "transparent",
    border: "none",
    padding: 0,
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    color: "var(--ta-link-green)",
    fontFamily: "var(--font-body)",
    letterSpacing: 0,
    textTransform: "none",
  },
  callNotesBlock: {
    padding: "3px 0 4px 2px",
  },
  callNotesTitle: {
    display: "block",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    letterSpacing: 0,
    marginBottom: "6px",
  },
  callNotesList: {
    paddingLeft: "16px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  scrollShell: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  scrollBody: {
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: "8px",
    paddingBottom: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
  },
  templates: { display: "flex", flexDirection: "column", gap: "10px" },
  templateBlock: { display: "flex", flexDirection: "column", gap: "4px" },
  contactedBtn: {
    flexShrink: 0,
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    border: "1px solid var(--ta-green)",
    borderRadius: "8px",
    padding: "11px 12px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    width: "100%",
  },
  contactedBtnError: {
    borderColor: "rgba(244, 239, 228, 0.9)",
    boxShadow: "0 0 0 2px rgba(79, 159, 104, 0.3)",
  },
  reportAction: {
    marginTop: "2px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  reportTooltip: {
    position: "relative",
    color: "var(--ta-muted-strong)",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  reportBlockMessage: {
    color: "var(--ta-muted-strong)",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.38)",
    borderRadius: "8px",
    padding: "7px 9px",
    fontSize: "calc(11.5px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  reportForm: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    backgroundColor: "rgba(79, 159, 104, 0.07)",
    border: "1px solid rgba(79, 159, 104, 0.22)",
    borderRadius: "8px",
    padding: "12px",
  },
  reportTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  requiredHint: {
    color: "var(--ta-muted)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    marginTop: "-6px",
  },
  requiredMark: {
    color: "var(--ta-green)",
    fontWeight: 700,
  },
  questionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  questionBlockError: {
    border: "1px solid rgba(79, 159, 104, 0.46)",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    borderRadius: "8px",
    padding: "8px",
  },
  question: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  answerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  answerBtn: {
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-subtle)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "9px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  answerBtnActive: {
    borderColor: "rgba(79, 159, 104, 0.55)",
    backgroundColor: "rgba(79, 159, 104, 0.18)",
    color: "var(--ta-green)",
  },
  answerBtnError: {
    borderColor: "rgba(244, 239, 228, 0.72)",
    boxShadow: "0 0 0 2px rgba(79, 159, 104, 0.22)",
  },
  notesLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  notesInput: {
    minHeight: "92px",
    resize: "vertical",
    backgroundColor: "var(--surface-subtle)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    fontFamily: "var(--font-body)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    padding: "9px",
  },
  notesInputError: {
    borderColor: "rgba(244, 239, 228, 0.72)",
    boxShadow: "0 0 0 2px rgba(79, 159, 104, 0.22)",
  },
};
