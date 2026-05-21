import { ArrowLeft, ArrowRight, Lightbulb, Plus, X } from "lucide-react";
import StageShell from "./StageShell";

const defaultReportQuestions = [
  { id: "pickedUp", label: "Did they pick up?", type: "yes_no" },
  { id: "notes", label: "Notes", type: "text" },
];

export default function CallNotesStage({
  callNotes,
  setCallNotes,
  reportBackSettings = { enabled: false, phone: "", questions: defaultReportQuestions },
  setReportBackSettings = () => {},
  stageNumLabel = "Stage 3 of 4",
  onPrev,
  onNext,
}) {
  const reportQuestions = reportBackSettings.questions?.length
    ? reportBackSettings.questions
    : defaultReportQuestions;

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
        <div style={styles.helper}>
          <Lightbulb size={18} color="var(--ta-green)" />
          <span>
            Use these for campaign-specific reminders, like asking about an AGM,
            confirming membership details, or mentioning a local issue.
          </span>
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
          Add note
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
            <p style={styles.emptyPreview}>No call notes yet.</p>
          )}
        </div>

        <div style={styles.reportBox}>
          <div style={styles.reportHeader}>
            <div>
              <span style={styles.previewTitle}>Report back</span>
              <p style={styles.reportText}>
                Ask phonebankers to answer your questions after each contact,
                then send you a summary at the end.
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
              <label style={styles.reportLabel}>
                Your phone number
                <input
                  value={reportBackSettings.phone}
                  onChange={(event) => updateReportBack({ phone: event.target.value })}
                  placeholder="e.g. +44 7712 345678"
                  style={styles.noteInput}
                />
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
        </div>

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
    gap: "18px",
    height: "auto",
    minHeight: "100%",
  },
  helper: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.24)",
    borderRadius: "10px",
    padding: "12px",
    color: "rgba(247, 241, 232, 0.74)",
    fontSize: "13px",
    lineHeight: 1.45,
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
    fontSize: "15px",
  },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    padding: "10px 12px",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
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
    fontSize: "14px",
  },
  previewBox: {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: "14px",
  },
  reportBox: {
    border: "1px solid rgba(79, 159, 104, 0.24)",
    borderRadius: "10px",
    backgroundColor: "rgba(79, 159, 104, 0.06)",
    padding: "14px",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
  },
  reportText: {
    color: "rgba(247, 241, 232, 0.66)",
    fontSize: "13px",
    lineHeight: 1.4,
    margin: 0,
  },
  reportLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "rgba(247, 241, 232, 0.72)",
    fontSize: "12px",
    marginTop: "12px",
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
    backgroundColor: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "var(--ta-cream)",
    padding: "10px 8px",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
  },
  toggleBtn: {
    border: "1px solid rgba(247, 241, 232, 0.24)",
    backgroundColor: "transparent",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
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
    fontSize: "16px",
    marginBottom: "6px",
  },
  previewList: {
    paddingLeft: "20px",
    color: "rgba(247, 241, 232, 0.76)",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  emptyPreview: {
    color: "rgba(247, 241, 232, 0.45)",
    fontSize: "13px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "16px",
    marginTop: "auto",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid rgba(247,241,232,0.25)",
    color: "var(--ta-cream)",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "15px",
  },
  continueBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "16px",
    boxShadow: "var(--border-glow)",
  },
};
