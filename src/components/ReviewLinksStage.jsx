import { useState } from 'react';
import { Check, Copy, QrCode, Smartphone, Users } from 'lucide-react';
import Links from './Links';
import StageShell from './StageShell';
import { normalizePhoneNumber } from '../utils';
import TransferQrModal from './TransferQrModal';

export default function ReviewLinksStage({
  contacts,
  templates,
  selectedDialCode,
  extraChannelsEnabled,
  setExtraChannelsEnabled,
  hostSessionEnabled,
  setHostSessionEnabled,
  hostSessionCallers,
  setHostSessionCallers,
  isOrganiser = false,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  stageNumLabel = "Stage 3 of 3",
  backLabel = "Back to messages",
  onPrev,
}) {
  const [showQR, setShowQR] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState('');
  const sharedCallNotes = callNotes.filter((note) => note.text?.trim());

  const handleOpenQR = () => setShowQR(true);
  const handleCloseQR = () => setShowQR(false);
  const enableExtraChannels = () => {
    setExtraChannelsEnabled(true);
    setShowChannelModal(false);
  };
  const handleChannelToggle = () => {
    if (extraChannelsEnabled) {
      setExtraChannelsEnabled(false);
      return;
    }
    setShowChannelModal(true);
  };
  const copyPhoneNumber = async (contact) => {
    const phone = normalizePhoneNumber(contact.phone, selectedDialCode);
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneId(contact.id);
      window.setTimeout(() => {
        setCopiedPhoneId((current) => (current === contact.id ? '' : current));
      }, 1600);
    } catch {
      // Clipboard can be unavailable in some browsers.
    }
  };

  return (
    <StageShell
      stageNumLabel={stageNumLabel}
      title="START CONTACTING"
      accentPhrase="START"
      accentVariant={3}
      subtitle="The easiest route is to transfer everything to your phone, then call and message from there."
      allowOverflow
    >
      <div style={styles.container}>
        <div style={styles.phoneTransferPanel}>
          <div style={styles.phoneTransferMain}>
            <div style={styles.phoneTransferCopy}>
              <span style={styles.recommendedLabel}>Recommended</span>
              <h3 style={styles.phoneTransferTitle}>Send this phonebank to your mobile</h3>
              <p style={styles.phoneTransferText}>
                Transfer your contacts, message templates, dial code and channel settings. On your phone, open this app, tap Scan data, then scan the QR codes shown here.
              </p>
            </div>
            <button onClick={handleOpenQR} style={styles.qrBtn} className="hover-lift">
              <Smartphone size={20} />
              Send to phone
              <QrCode size={20} />
            </button>
          </div>

          {isOrganiser && (
            <div style={styles.hostInline}>
              <div style={styles.hostInlineCopy}>
                <Users size={16} color="var(--ta-green)" />
                <span>Running this with a group?</span>
              </div>
              <button
                type="button"
                onClick={() => setHostSessionEnabled(!hostSessionEnabled)}
                style={{
                  ...styles.hostToggle,
                  ...(hostSessionEnabled ? styles.hostToggleActive : {}),
                }}
              >
                {hostSessionEnabled ? "Splitting on" : "Split between participants"}
              </button>
            </div>
          )}

          {isOrganiser && hostSessionEnabled && (
            <div style={styles.hostControls}>
              <div style={styles.hostControlsMain}>
                <label style={styles.hostLabel} htmlFor="caller-count">
                  Split between
                </label>
                <input
                  id="caller-count"
                  type="number"
                  min="1"
                  max={Math.max(1, contacts.length)}
                  value={hostSessionCallers}
                  onChange={(event) => {
                    const nextValue = Math.max(
                      1,
                      Number.parseInt(event.target.value, 10) || 1
                    );
                    setHostSessionCallers(nextValue);
                  }}
                  style={styles.hostInput}
                />
                <span style={styles.hostLabel}>participants</span>
              </div>
              <span style={styles.hostSummary}>
                About{" "}
                {Math.ceil(
                  contacts.length / Math.max(1, Number(hostSessionCallers) || 1)
                )}{" "}
                contacts each
              </span>
            </div>
          )}
        </div>

        <div style={styles.utilityRow}>
          <div style={styles.desktopCopy}>
            <span style={styles.fallbackLabel}>Send from desktop instead</span>
            <span style={styles.desktopHint}>
              You can also use the links below directly from this browser.
            </span>
          </div>
          <button
            onClick={handleChannelToggle}
            style={styles.secondaryBtn}
            className="hover-lift"
          >
            {extraChannelsEnabled ? 'Signal / Telegram enabled' : 'Add Signal / Telegram'}
          </button>
        </div>

        {sharedCallNotes.length > 0 && (
          <div style={styles.callNotesBox}>
            <span style={styles.callNotesTitle}>Call notes</span>
            <p style={styles.callNotesIntro}>
              These prompts apply to everyone in this phonebank.
            </p>
            <ul style={styles.callNotesList}>
              {sharedCallNotes.map((note) => (
                <li key={note.id}>{note.text}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={styles.contactsList}>
          {contacts.map((c) => (
            <div key={c.id} style={styles.contactCard} className="glass-card">
              <div style={styles.contactHeader}>
                <div style={styles.contactInfo}>
                  <span style={styles.contactName}>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => copyPhoneNumber(c)}
                    style={styles.contactPhoneBtn}
                    className="hover-lift"
                  >
                    {copiedPhoneId === c.id ? <Check size={13} /> : <Copy size={13} />}
                    <span>{normalizePhoneNumber(c.phone, selectedDialCode)}</span>
                  </button>
                </div>
              </div>
              <div style={styles.linksWrapper}>
                {templates.map((t) => (
                  <Links
                    key={t.id}
                    contact={c}
                    template={t}
                    dialCode={selectedDialCode}
                    extraChannelsEnabled={extraChannelsEnabled}
                    callNotes={callNotes}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footerRow}>
          <button onClick={onPrev} style={styles.backBtn} className="hover-lift">
            {backLabel}
          </button>
         
        </div>

        {showQR && (
          <TransferQrModal
            contacts={contacts}
            templates={templates}
            selectedDialCode={selectedDialCode}
            extraChannelsEnabled={extraChannelsEnabled}
            callNotes={callNotes}
            reportBackSettings={reportBackSettings}
            hostSessionEnabled={isOrganiser && hostSessionEnabled}
            hostSessionCallers={hostSessionCallers}
            onClose={handleCloseQR}
          />
        )}

        {showChannelModal && (
          <div style={styles.modalOverlay} onClick={() => setShowChannelModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Add Signal and Telegram</h3>
              <p style={styles.modalText}>
                This adds Signal and Telegram buttons beside WhatsApp and SMS. Signal does not support pre-filled messages, so clicking Signal will copy the message to your clipboard and then open the chat with the contact's number.
              </p>
              <p style={styles.modalText}>
                Telegram will open the contact by phone number where supported by the app.
              </p>
              <div style={styles.modalActions}>
                <button onClick={() => setShowChannelModal(false)} style={styles.modalSecondary}>Cancel</button>
                <button onClick={enableExtraChannels} style={styles.modalClose}>Enable</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StageShell>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    flex: '0 0 auto',
    minHeight: 'auto',
  },
  phoneTransferPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'rgba(79, 159, 104, 0.1)',
    border: '1px solid rgba(79, 159, 104, 0.34)',
    borderRadius: '14px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
  },
  phoneTransferMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    width: '100%',
  },
  phoneTransferCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
    flex: 1,
  },
  recommendedLabel: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--ta-green)',
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  phoneTransferTitle: {
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-cream)',
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    lineHeight: 1,
  },
  phoneTransferText: {
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    maxWidth: '660px',
  },
  hostInline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    width: '100%',
    borderTop: '1px solid var(--ta-border-subtle)',
    paddingTop: '11px',
  },
  hostInlineCopy: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  hostToggle: {
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-medium)',
    color: 'var(--ta-muted-strong)',
    borderRadius: '999px',
    padding: '7px 12px',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    minWidth: '150px',
    whiteSpace: 'nowrap',
  },
  hostToggleActive: {
    backgroundColor: 'var(--ta-green)',
    borderColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
  },
  hostControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '8px',
    width: '100%',
    backgroundColor: 'color-mix(in srgb, var(--ta-dark-2) 34%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '10px',
    padding: '9px 10px',
  },
  hostControlsMain: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  hostLabel: {
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  hostInput: {
    width: '64px',
    backgroundColor: 'color-mix(in srgb, var(--ta-dark-2) 72%, transparent)',
    border: '1px solid rgba(79, 159, 104, 0.34)',
    borderRadius: '8px',
    color: 'var(--ta-cream)',
    padding: '7px 8px',
    fontFamily: 'var(--font-body)',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
  },
  hostSummary: {
    color: 'rgba(79, 159, 104, 0.9)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  utilityRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2px',
  },
  desktopCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  fallbackLabel: {
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.06em',
  },
  desktopHint: {
    color: 'var(--ta-muted)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  contactsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: '0 0 auto',
    minHeight: 'auto',
    overflow: 'visible',
    paddingRight: 0,
  },
  contactCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'color-mix(in srgb, var(--ta-cream) 5%, transparent)',
    border: '1px solid var(--ta-border-subtle)',
    borderRadius: '12px',
    minWidth: 0,
  },
  contactHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid var(--ta-border-subtle)',
    paddingBottom: '8px',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  contactName: {
    fontFamily: 'var(--font-heading)',
    fontSize: "calc(19px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-cream)',
    letterSpacing: '0.05em',
  },
  contactPhoneBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    color: 'var(--ta-link-green)',
    fontFamily: 'var(--font-body)',
    letterSpacing: 0,
    textTransform: 'none',
    alignSelf: 'flex-start',
  },
  linksWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: '8px',
  },
  callNotesBox: {
    backgroundColor: 'rgba(79, 159, 104, 0.07)',
    border: '1px solid rgba(79, 159, 104, 0.22)',
    borderRadius: '12px',
    padding: '12px 14px',
  },
  callNotesTitle: {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    color: 'var(--ta-green)',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    letterSpacing: '0.05em',
    marginBottom: '3px',
  },
  callNotesIntro: {
    color: 'var(--ta-muted)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
    marginBottom: '8px',
  },
  callNotesList: {
    paddingLeft: '18px',
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    borderTop: '1px solid var(--ta-border-subtle)',
    paddingTop: '16px',
  },
  backBtn: {
    backgroundColor: 'transparent',
    border: '1px solid var(--ta-border-medium)',
    color: 'var(--ta-cream)',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    fontWeight: 'bold',
  },
  qrBtn: {
    backgroundColor: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    borderRadius: '10px',
    padding: '13px 18px',
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    fontWeight: 'bold',
    boxShadow: 'var(--border-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    minWidth: '190px',
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(79, 159, 104, 0.35)',
    color: 'var(--ta-green)',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    fontWeight: 'bold',
  },
  restartBtn: {
    backgroundColor: 'rgba(53,168,102,0.08)',
    border: '1px solid rgba(53,168,102,0.3)',
    color: 'var(--ta-green)',
    borderRadius: '10px',
    padding: '10px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'var(--modal-overlay)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: 'var(--modal-card-bg)',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    color: 'var(--ta-cream)',
    width: '300px',
    boxShadow: 'var(--modal-card-shadow)',
  },
  modalTitle: { marginBottom: '12px' },
  modalText: {
    color: 'var(--ta-muted-strong)',
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: '1.45',
    marginBottom: '10px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  modalSecondary: {
    background: 'transparent',
    border: '1px solid var(--ta-border-medium)',
    color: 'var(--ta-cream)',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
  },
  modalClose: {
    background: 'var(--ta-green)',
    color: 'var(--ta-dark)',
    border: 'none',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '8px',
  },
};
