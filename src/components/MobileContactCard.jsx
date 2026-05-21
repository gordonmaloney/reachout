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
  fontSize: '12px',
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
      {isReporting ? (
        <div style={styles.reportForm}>
          <span style={styles.reportTitle}>Contact report</span>
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
      {reportEnabled && !isReporting && (
        <button type="button" onClick={startReport} style={styles.contactedBtn}>
          Contacted
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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  name: { fontSize: '18px', color: 'var(--ta-cream)', fontFamily: 'var(--font-heading)' },
  phone: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: '14px',
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
    fontSize: '14px',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  callNotesList: {
    paddingLeft: '17px',
    color: 'rgba(247, 241, 232, 0.74)',
    fontSize: '12px',
    lineHeight: 1.35,
  },
  templates: { display: 'flex', flexDirection: 'column', gap: '12px' },
  templateBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactedBtn: {
    marginTop: '2px',
    backgroundColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    fontFamily: 'var(--font-heading)',
    fontSize: '15px',
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
    fontSize: '16px',
    letterSpacing: '0.05em',
  },
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  question: {
    color: 'rgba(247, 241, 232, 0.78)',
    fontSize: '13px',
  },
  answerRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  answerBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(247, 241, 232, 0.2)',
    color: 'var(--ta-cream)',
    borderRadius: '8px',
    padding: '8px',
    fontFamily: 'var(--font-heading)',
    fontSize: '14px',
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
    color: 'rgba(247, 241, 232, 0.78)',
    fontSize: '13px',
  },
  notesInput: {
    minHeight: '92px',
    resize: 'vertical',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: 'var(--ta-cream)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    padding: '9px',
  },
};
