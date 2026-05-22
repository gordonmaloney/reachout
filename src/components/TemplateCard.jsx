import { X } from 'lucide-react';

export default function TemplateCard({ template, onChange, onDelete }) {
  const handleTitle = (e) => onChange('title', e.target.value);
  const handleBody = (e) => onChange('body', e.target.value);

  return (
    <div className="glass-card" style={styles.card}>
      <div style={styles.header}>
        <label style={styles.titleField}>
          <input
            type="text"
            value={template.title}
            onChange={handleTitle}
            placeholder="Template title"
            style={styles.titleInput}
          />
        </label>
        <button onClick={onDelete} style={styles.deleteBtn} title="Delete template">
          <X size={16} color="var(--ta-red)" />
        </button>
      </div>
      <textarea
        value={template.body}
        onChange={handleBody}
        placeholder="Message body – use {FIRSTNAME} for personalization"
        style={styles.bodyTextarea}
      />
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    minHeight: '200px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  titleField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  titleInput: {
    width: '100%',
    background: 'rgba(79, 159, 104, 0.08)',
    border: '1px solid rgba(79, 159, 104, 0.28)',
    borderRadius: '6px',
    color: 'var(--ta-cream)',
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    outline: 'none',
    padding: '7px 9px',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  bodyTextarea: {
    flex: 1,
    background: 'var(--surface-subtle)',
    border: '1px solid var(--ta-border-subtle)',
    color: 'var(--ta-cream)',
    padding: '8px',
    borderRadius: '6px',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
};
