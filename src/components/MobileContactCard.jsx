import { useState } from 'react';
import Links from './Links';
import { Check, Contact, Copy, Phone } from 'lucide-react';
import { generateCallLink, normalizePhoneNumber } from '../utils';


const callButtonStyle = {
  backgroundColor: 'transparent',
  border: '1px solid var(--ta-green)',
  color: 'var(--ta-green)',
  borderRadius: '8px',
  padding: '6px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontFamily: 'var(--font-heading)',
  fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  cursor: 'pointer',
  textDecoration: 'none',
  flexShrink: 0,
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
}) {
  const callLink = generateCallLink(contact, selectedDialCode);
  const previewPhone = normalizePhoneNumber(contact.phone, selectedDialCode);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const isReporting = Boolean(report?.contacted);
  const reportEnabled = Boolean(reportBackSettings.enabled);
  const reportQuestions = reportBackSettings.questions?.filter((question) =>
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
          <a href={callLink} target="_blank" rel="noopener noreferrer" style={callButtonStyle} className="hover-lift">
            <Phone size={14} /> Call
          </a>
        )}
      </div>
      <div style={styles.scrollShell}>
        <div style={styles.scrollBody} className="mobile-card-scroll">
          {isReporting ? (
            <div style={styles.reportForm}>
              <span style={styles.reportTitle}>Contact report</span>
              {reportBackRequired && (
                <span style={styles.requiredHint}>Required before moving on</span>
              )}
              {reportQuestions.map((question) =>
                question.type === "yes_no" ? (
                  <div key={question.id} style={styles.questionBlock}>
                    <span style={styles.question}>{question.label}</span>
                    <div style={styles.answerRow}>
                      <button
                        type="button"
                        onClick={() => updateAnswer(question.id, "yes")}
                        style={{
                          ...styles.answerBtn,
                          ...(report?.answers?.[question.id] === "yes" ? styles.answerBtnActive : {}),
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAnswer(question.id, "no")}
                        style={{
                          ...styles.answerBtn,
                          ...(report?.answers?.[question.id] === "no" ? styles.answerBtnActive : {}),
                        }}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <label key={question.id} style={styles.notesLabel}>
                    {question.label}
                    <textarea
                      value={report?.answers?.[question.id] || ""}
                      onChange={(event) => updateAnswer(question.id, event.target.value)}
                      placeholder="Anything useful to pass back?"
                      style={styles.notesInput}
                    />
                  </label>
                )
              )}
              {reportQuestions.length === 0 && (
                <span style={styles.question}>No reportback questions set.</span>
              )}
            </div>
          ) : callNotes.filter((note) => note.text?.trim()).length > 0 && (
            <div style={styles.callNotesBox}>
              <span style={styles.callNotesTitle}>Call notes</span>
              <ul style={styles.callNotesList}>
                {callNotes
                  .filter((note) => note.text?.trim())
                  .map((note) => (
                    <li key={note.id}>{note.text}</li>
                  ))}
              </ul>
            </div>
          )}
          {!isReporting && (
            <div style={styles.templates}>
              {templates.map((t) => (
                <div key={t.id} style={styles.templateBlock}>
                  <Links contact={contact} template={t} dialCode={selectedDialCode} extraChannelsEnabled={extraChannelsEnabled} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {reportEnabled && !isReporting && (
        <button type="button" onClick={startReport} style={styles.contactedBtn}>
          {reportBackRequired ? "Contacted - report required" : "Contacted"}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '380px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'rgba(79, 159, 104, 0.12)',
    border: '1px solid rgba(79, 159, 104, 0.35)',
    color: 'var(--ta-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactText: {
    flex: 1,
    minWidth: 0,
  },
  name: { fontSize: "calc(18px * var(--reachout-text-scale, 1))", color: 'var(--ta-cream)', fontFamily: 'var(--font-heading)' },
  phone: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    color: 'rgba(79, 159, 104, 0.68)',
    fontFamily: 'var(--font-body)',
    letterSpacing: 0,
    textTransform: 'none',
  },
  callNotesBox: {
    backgroundColor: 'rgba(79, 159, 104, 0.07)',
    border: '1px solid rgba(79, 159, 104, 0.22)',
    borderRadius: '8px',
    padding: '9px 10px',
  },
  callNotesTitle: {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-green)',
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  callNotesList: {
    paddingLeft: '17px',
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  scrollShell: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  scrollBody: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '10px',
    paddingBottom: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  },
  templates: { display: 'flex', flexDirection: 'column', gap: '12px' },
  templateBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactedBtn: {
    marginTop: '2px',
    flexShrink: 0,
    backgroundColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  reportForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(79, 159, 104, 0.07)',
    border: '1px solid rgba(79, 159, 104, 0.22)',
    borderRadius: '8px',
    padding: '12px',
  },
  reportTitle: {
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-green)',
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
  },
  requiredHint: {
    color: 'var(--ta-muted)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    marginTop: '-6px',
  },
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  question: {
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  answerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  answerBtn: {
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-subtle)',
    color: 'var(--ta-cream)',
    borderRadius: '8px',
    padding: '8px',
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
  },
  answerBtnActive: {
    borderColor: 'rgba(79, 159, 104, 0.55)',
    backgroundColor: 'rgba(79, 159, 104, 0.18)',
    color: 'var(--ta-green)',
  },
  notesLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  notesInput: {
    minHeight: '92px',
    resize: 'vertical',
    backgroundColor: 'var(--surface-subtle)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '8px',
    color: 'var(--ta-cream)',
    fontFamily: 'var(--font-body)',
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    padding: '9px',
  },
};
