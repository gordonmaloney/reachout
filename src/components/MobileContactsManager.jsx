import { useState } from "react";
import { Check, Edit2, Trash2, X } from "lucide-react";
import { normalizePhoneNumber } from "../utils";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MobileContactsManager({
  contacts,
  setContacts,
  selectedDialCode,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

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

      <div style={styles.list}>
        {contacts.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyTitle}>No contacts loaded</span>
            <span style={styles.emptyText}>Use Scan data to import a list.</span>
          </div>
        ) : (
          contacts.map((contact) => {
            const isEditing = editingId === contact.id;

            return (
              <div key={contact.id} style={styles.row}>
                <div style={styles.avatar}>{getInitials(contact.name)}</div>
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
                      <span style={styles.name}>{contact.name}</span>
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
            );
          })
        )}
      </div>
    </div>
  );
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
    alignItems: "center",
    gap: "10px",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "color-mix(in srgb, var(--ta-cream) 3%, transparent)",
    padding: "10px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    color: "var(--ta-green)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    flexShrink: 0,
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
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
};
