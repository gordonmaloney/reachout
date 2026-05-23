import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, Lightbulb, Plus, X } from "lucide-react";
import StageShell from "./StageShell";

const defaultReportQuestions = [
  { id: "pickedUp", label: "Did they pick up?", type: "yes_no" },
  { id: "notes", label: "Notes", type: "text" },
];

export default function CallNotesStage({
  callNotes,
  setCallNotes,
  reportBackSettings = { enabled: false, phone: "", mandatory: false, questions: defaultReportQuestions },
  setReportBackSettings = () => {},
  reportbackPhoneFocusToken = 0,
  stageNumLabel = "Stage 3 of 4",
  onPrev,
  onNext,
}) {
  const phoneInputRef = useRef(null);
  const lastFocusTokenRef = useRef(reportbackPhoneFocusToken);
  const reportQuestions = reportBackSettings.questions?.length
    ? reportBackSettings.questions
    : defaultReportQuestions;

  useEffect(() => {
    const isNewFocusRequest = reportbackPhoneFocusToken !== lastFocusTokenRef.current;
    lastFocusTokenRef.current = reportbackPhoneFocusToken;

    if (
      !isNewFocusRequest ||
      !reportbackPhoneFocusToken ||
      !reportBackSettings.enabled ||
      reportBackSettings.phone.trim()
    ) {
      return undefined;
    }

    const input = phoneInputRef.current;
    if (!input) return undefined;

    input.focus({ preventScroll: true });
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.classList.add("reportback-number-attention");

    const timeout = window.setTimeout(() => {
      input.classList.remove("reportback-number-attention");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [reportbackPhoneFocusToken, reportBackSettings.enabled, reportBackSettings.phone]);

  const addNote = () => {
    setCallNotes((notes) => [
      ...notes,
      { id: `note_${Date.now()}`, text: "" },
    ]);
  };

  const updateNote = (id, text) => {
    setCallNotes((notes) =>
      notes.map((note) => (note.id === id ? { ...note, text } : note))
    );
  };

  const deleteNote = (id) => {
    setCallNotes((notes) => notes.filter((note) => note.id !== id));
  };

  const updateReportBack = (patch) => {
    setReportBackSettings((settings) => ({
      ...settings,
      questions: settings.questions?.length ? settings.questions : defaultReportQuestions,
      ...patch,
    }));
  };

  const addReportQuestion = () => {
    updateReportBack({
      questions: [
        ...reportQuestions,
        { id: `question_${Date.now()}`, label: "", type: "text" },
      ],
    });
  };

  const updateReportQuestion = (id, patch) => {
    updateReportBack({
      questions: reportQuestions.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      ),
    });
  };

  const deleteReportQuestion = (id) => {
    updateReportBack({
      questions: reportQuestions.filter((question) => question.id !== id),
    });
  };

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="CALL NOTES AND REPORTBACKS"
      accentPhrase="CALL NOTES"
      accentVariant={2}
      subtitle="Add phonebanking prompts and choose what people should report back after each contact."
      allowOverflow
    >
      <div className="glass-card" style={styles.container}>
        <section style={styles.settingPanel}>
          <div style={styles.settingHeader}>
            <div style={styles.settingTitleRow}>
              <span style={styles.settingIcon}>
                <Lightbulb size={17} />
              </span>
              <div>
                <h3 style={styles.settingTitle}>Call notes</h3>
              </div>
            </div>
            <p style={styles.settingText}>
              Add short reminders that appear alongside each contact while
              people are phonebanking. Useful for campaign context, asks, or
              local issues.
            </p>
          </div>

          <div style={styles.notesList}>
            {callNotes.map((note, index) => (
              <div key={note.id} style={styles.noteRow}>
                <span style={styles.noteNumber}>{index + 1}</span>
                <input
                  value={note.text}
                  onChange={(event) => updateNote(note.id, event.target.value)}
                  placeholder="e.g. Remind them about the AGM on the 18th"
                  style={styles.noteInput}
                />
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  style={styles.deleteBtn}
                  title="Remove note"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addNote} style={styles.addBtn}>
            <Plus size={16} />
            Add call note
          </button>

          <div style={styles.previewBox}>
            <span style={styles.previewTitle}>How this appears to phonebankers</span>
            {callNotes.filter((note) => note.text.trim()).length > 0 ? (
              <ul style={styles.previewList}>
                {callNotes
                  .filter((note) => note.text.trim())
                  .map((note) => (
                    <li key={note.id}>{note.text}</li>
                  ))}
              </ul>
            ) : (
              <p style={styles.emptyPreview}>No call notes yet. Phonebankers will just see each contact and the message options.</p>
            )}
          </div>
        </section>

        <section
          style={{
            ...styles.settingPanel,
            ...(reportBackSettings.enabled ? styles.settingPanelActive : {}),
          }}
        >
          <div style={styles.reportHeader}>
            <div>
              <div style={styles.settingTitleRow}>
                <span style={styles.settingIcon}>
                  <ClipboardList size={17} />
                </span>
                <div>
                  <h3 style={styles.settingTitle}>Reportbacks</h3>
                </div>
              </div>
              <p style={styles.settingText}>
                Turn this on if phonebankers should record what happened after
                each contact and send you a summary at the end.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateReportBack({ enabled: !reportBackSettings.enabled })
              }
              style={{
                ...styles.toggleBtn,
                ...(reportBackSettings.enabled ? styles.toggleBtnActive : {}),
              }}
            >
              {reportBackSettings.enabled ? "Enabled" : "Enable"}
            </button>
          </div>

          {reportBackSettings.enabled && (
            <>
              <p style={styles.reportText}>
                Add the number that should receive reports, then choose the
                questions people should answer after each contact.
              </p>

              <label style={styles.reportLabel}>
                Your phone number
                <input
                  ref={phoneInputRef}
                  className="reportback-number-input"
                  value={reportBackSettings.phone}
                  onChange={(event) => updateReportBack({ phone: event.target.value })}
                  placeholder="e.g. +44 7712 345678"
                  style={styles.noteInput}
                />
              </label>

              <label style={styles.mandatoryRow}>
                <input
                  type="checkbox"
                  checked={Boolean(reportBackSettings.mandatory)}
                  onChange={(event) =>
                    updateReportBack({ mandatory: event.target.checked })
                  }
                  style={styles.checkbox}
                />
                <span>
                  <strong style={styles.mandatoryTitle}>Make reportback mandatory</strong>
                  <span style={styles.mandatoryText}>
                    Phonebankers cannot move to the next contact until these
                    questions are answered.
                  </span>
                </span>
              </label>

              <div style={styles.questionsList}>
                {reportQuestions.map((question, index) => (
                  <div key={question.id} style={styles.questionRow}>
                    <span style={styles.noteNumber}>{index + 1}</span>
                    <input
                      value={question.label}
                      onChange={(event) =>
                        updateReportQuestion(question.id, { label: event.target.value })
                      }
                      placeholder="Question to ask after contact"
                      style={styles.noteInput}
                    />
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateReportQuestion(question.id, { type: event.target.value })
                      }
                      style={styles.questionType}
                    >
                      <option value="yes_no">Yes / no</option>
                      <option value="text">Free text</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => deleteReportQuestion(question.id)}
                      style={styles.deleteBtn}
                      title="Remove question"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addReportQuestion} style={styles.addBtn}>
                <Plus size={16} />
                Add reportback question
              </button>
            </>
          )}
        </section>

        <div style={styles.footerRow}>
          <button onClick={onPrev} style={styles.backBtn} className="hover-lift">
            <ArrowLeft size={18} />
            Back to messages
          </button>
          <button onClick={onNext} style={styles.continueBtn} className="hover-lift">
            <span>Start contacting</span>
            <ArrowRight size={18} />
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
    gap: "16px",
    height: "auto",
    minHeight: "100%",
  },
  settingPanel: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "14px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  settingPanelActive: {
    border: "1px solid rgba(79, 159, 104, 0.24)",
    backgroundColor: "rgba(79, 159, 104, 0.055)",
  },
  settingHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  settingTitleRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    minWidth: 0,
  },
  settingIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.24)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingTitle: {
    color: "var(--ta-cream)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    lineHeight: 1,
    margin: 0,
  },
  settingText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: 0,
    maxWidth: "680px",
  },
  notesList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    minHeight: 0,
  },
  noteRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 36px",
    gap: "10px",
    alignItems: "center",
  },
  noteNumber: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "rgba(79, 159, 104, 0.12)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  noteInput: {
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 4%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    padding: "10px 12px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  deleteBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 77, 77, 0.3)",
    color: "var(--ta-red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "9px 14px",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  previewBox: {
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "14px",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
  },
  reportText: {
    color: "var(--ta-muted)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
    margin: 0,
  },
  reportLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    marginTop: "12px",
  },
  mandatoryRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid rgba(79, 159, 104, 0.22)",
    borderRadius: "10px",
    backgroundColor: "rgba(79, 159, 104, 0.06)",
    padding: "11px",
    marginTop: "12px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  checkbox: {
    marginTop: "2px",
    accentColor: "var(--ta-green)",
    flexShrink: 0,
  },
  mandatoryTitle: {
    display: "block",
    color: "var(--ta-cream)",
    fontSize: "calc(12.5px * var(--reachout-text-scale, 1))",
    marginBottom: "2px",
  },
  mandatoryText: {
    display: "block",
    color: "var(--ta-muted)",
    lineHeight: 1.35,
  },
  questionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
    marginBottom: "14px",
  },
  questionRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr 112px 36px",
    gap: "10px",
    alignItems: "center",
  },
  questionType: {
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 4%, transparent)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    padding: "10px 8px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  toggleBtn: {
    border: "1px solid var(--ta-border-medium)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    flexShrink: 0,
  },
  toggleBtnActive: {
    borderColor: "rgba(79, 159, 104, 0.5)",
    backgroundColor: "rgba(79, 159, 104, 0.16)",
    color: "var(--ta-green)",
  },
  previewTitle: {
    display: "block",
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    letterSpacing: "0.05em",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    marginBottom: "6px",
  },
  previewList: {
    paddingLeft: "20px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
  },
  emptyPreview: {
    color: "var(--ta-muted)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    borderTop: "1px solid var(--ta-border-subtle)",
    paddingTop: "16px",
    marginTop: "auto",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid var(--ta-border-medium)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "10px 20px",
    fontFamily: "var(--font-body)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
  },
  continueBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    boxShadow: "var(--border-glow)",
  },
};
