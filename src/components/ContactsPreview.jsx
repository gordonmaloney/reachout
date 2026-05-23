import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { normalizePhoneNumber } from '../utils';

export default function ContactsPreview({
  contacts,
  setContacts,
  selectedDialCode,
  duplicateContactIds = new Set(),
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id) => {
    if (!editName.trim() || !editPhone.trim()) {
      alert("Both Name and Phone Number are required.");
      return;
    }
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, name: editName.trim(), phone: editPhone.trim() } : c
    ));
    setEditingId(null);
  };

  const deleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div style={styles.listContainer}>
      <div style={styles.tableHeader}>
        <span style={styles.headerLabel}>NAME</span>
        <span style={styles.headerLabel}>PHONE NUMBER</span>
      </div>

      <div style={styles.rowsWrapper}>
        {contacts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No contacts imported yet.</p>
            <p style={styles.emptySubText}>Use the paste dropzone on the left to add names and numbers.</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const isEditing = editingId === contact.id;
            const isDuplicate = duplicateContactIds.has(contact.id);
            
            return (
              <div
                key={contact.id}
                style={{
                  ...styles.contactRow,
                  ...(isDuplicate ? styles.duplicateContactRow : {}),
                }}
              >
                <div style={styles.avatar}>
                  {getInitials(contact.name)}
                </div>

                <div style={styles.infoArea}>
                  {isEditing ? (
                    <div style={styles.editForm}>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={styles.editInput}
                        placeholder="Full Name"
                      />
                      <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        style={styles.editInput}
                        placeholder="Phone Number"
                      />
                    </div>
                  ) : (
                    <div style={styles.staticValues}>
                      <div style={styles.nameGroup}>
                        <span style={styles.contactName}>{contact.name}</span>
                        {isDuplicate && (
                          <span style={styles.duplicateLabel}>Duplicate</span>
                        )}
                      </div>
                      <span style={styles.contactPhone}>{normalizePhoneNumber(contact.phone, selectedDialCode)}</span>
                    </div>
                  )}
                </div>

                <div style={styles.actions}>
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => saveEdit(contact.id)} 
                        style={styles.actionBtnSave}
                        title="Save Changes"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        style={styles.actionBtnCancel}
                        title="Cancel Editing"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => startEdit(contact)} 
                        style={styles.actionBtn}
                        title="Edit Contact"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => deleteContact(contact.id)} 
                        style={styles.actionBtnDelete}
                        title="Remove Contact"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    padding: '0 12px 10px 12px',
    borderBottom: '1px solid var(--ta-border-subtle)',
    marginBottom: '8px',
  },
  headerLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
    letterSpacing: '0.05em',
    width: '45%',
  },
  rowsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '4px',
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 3%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '12px',
    padding: '10px 16px',
    gap: '16px',
    transition: 'all 0.2s ease',
  },
  duplicateContactRow: {
    backgroundColor: 'color-mix(in srgb, var(--ta-red) 10%, transparent)',
    border: '1px solid color-mix(in srgb, var(--ta-red) 48%, transparent)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(79, 159, 104, 0.1)',
    border: '1px solid rgba(79, 159, 104, 0.25)',
    color: 'var(--ta-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 'bold',
    flexShrink: 0,
  },
  infoArea: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
  },
  staticValues: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
  },
  nameGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '50%',
    minWidth: 0,
  },
  contactName: {
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-cream)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
  },
  duplicateLabel: {
    flexShrink: 0,
    border: '1px solid color-mix(in srgb, var(--ta-red) 52%, transparent)',
    color: 'var(--ta-red)',
    borderRadius: '999px',
    padding: '2px 6px',
    fontFamily: 'var(--font-mono)',
    fontSize: "calc(9px * var(--reachout-text-scale, 1))",
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  contactPhone: {
    fontSize: "calc(13.5px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted-strong)',
    fontFamily: 'var(--font-mono)',
    width: '50%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  editForm: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  editInput: {
    backgroundColor: 'color-mix(in srgb, var(--ta-dark-2) 82%, transparent)',
    border: '1px solid var(--ta-green)',
    color: 'var(--ta-cream)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    fontFamily: 'var(--font-body)',
    width: '50%',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--ta-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s, background 0.2s',
  },
  actionBtnDelete: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--ta-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s, background 0.2s',
  },
  actionBtnSave: {
    backgroundColor: 'rgba(79, 159, 104, 0.15)',
    border: '1px solid var(--ta-green)',
    color: 'var(--ta-green)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  actionBtnCancel: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 77, 77, 0.3)',
    color: 'var(--ta-red)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    gap: '8px',
    height: '100%',
  },
  emptyText: {
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
  },
  emptySubText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-muted)',
    maxWidth: '280px',
  }
};
// Add hover behavior via standard style injects or class manipulation
const injectRowHoverStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'contacts-preview-hover';
  if (document.getElementById(styleId)) return;
  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.innerHTML = `
    .action-btn-hover:hover {
      background: rgba(255,255,255,0.06) !important;
      color: var(--ta-green) !important;
    }
    .action-btn-delete-hover:hover {
      background: rgba(255, 77, 77, 0.1) !important;
      color: var(--ta-red) !important;
    }
  `;
  document.head.appendChild(styleEl);
};
// Trigger style inject
injectRowHoverStyles();
