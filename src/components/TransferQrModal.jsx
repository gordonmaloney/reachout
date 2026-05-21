import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Link, X } from "lucide-react";
import {
  createCompactTransferLinks,
  MAX_TRANSFER_LINK_LENGTH,
} from "../linkTransferUtils";

export default function TransferQrModal({
  contacts,
  templates,
  selectedDialCode,
  extraChannelsEnabled,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  hostSessionEnabled = false,
  hostSessionCallers = 1,
  onClose,
}) {
  const batches = useMemo(() => {
    const callerCount = hostSessionEnabled
      ? Math.min(
          Math.max(1, Number(hostSessionCallers) || 1),
          contacts.length || 1
        )
      : 1;
    const batchSize = Math.ceil((contacts.length || 1) / callerCount);

    return Array.from({ length: callerCount }, (_, index) => {
      const batchContacts = contacts.slice(
        index * batchSize,
        (index + 1) * batchSize
      );

      return {
        label: hostSessionEnabled ? `Participant ${index + 1}` : "Your phone",
        contacts: batchContacts,
      };
    });
  }, [contacts, hostSessionCallers, hostSessionEnabled]);
  const [batchTransfers, setBatchTransfers] = useState([]);
  const [batchQrCodes, setBatchQrCodes] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [linkStatus, setLinkStatus] = useState("");
  const [qrError, setQrError] = useState("");
  const currentBatch = batches[currentBatchIndex] || batches[0];
  const currentTransfer = batchTransfers[currentBatchIndex] || {};
  const transferLinks = currentTransfer.links || [];
  const linkMessage = currentTransfer.message || "";
  const qrCodes = batchQrCodes[currentBatchIndex] || [];

  useEffect(() => {
    let cancelled = false;

    async function generateTransfers() {
      try {
        const QRCode = await import("qrcode");
        const nextTransfers = await Promise.all(
          batches.map((batch) =>
            createCompactTransferLinks({
              contacts: batch.contacts || [],
              templates,
              callNotes,
              reportBackSettings,
              selectedDialCode,
              extraChannelsEnabled,
            })
          )
        );
        const nextCodes = await Promise.all(
          nextTransfers.map((transfer) =>
            Promise.all(
              (transfer.links || []).map((link) =>
                QRCode.default.toDataURL(link.url, {
                  errorCorrectionLevel: "M",
                  width: 760,
                  margin: 2,
                })
              )
            )
          )
        );

        if (!cancelled) {
          setBatchTransfers(nextTransfers);
          setBatchQrCodes(nextCodes);
          setCurrentBatchIndex(0);
          setCurrentLinkIndex(0);
          setLinkStatus("");
          setQrError("");
        }
      } catch {
        if (!cancelled) {
          setBatchTransfers([]);
          setBatchQrCodes([]);
          setQrError(
            "This transfer is too large to fit cleanly in a QR code. Try copying the link below, or shorten the message templates."
          );
        }
      }
    }

    generateTransfers();

    return () => {
      cancelled = true;
    };
  }, [
    batches,
    callNotes,
    extraChannelsEnabled,
    reportBackSettings,
    selectedDialCode,
    templates,
  ]);

  const showPreviousBatch = () => {
    setCurrentBatchIndex((index) => Math.max(0, index - 1));
    setCurrentLinkIndex(0);
  };

  const showNextBatch = () => {
    setCurrentBatchIndex((index) => Math.min(batches.length - 1, index + 1));
    setCurrentLinkIndex(0);
  };

  const copyTransferLink = async (url, index) => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setLinkStatus(`Link ${index + 1} copied.`);
    } catch {
      setLinkStatus("Copy failed. Select and copy the link manually.");
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} style={styles.iconBtn} title="Close">
          <X size={18} />
        </button>

        <div style={styles.layout}>
          <div style={styles.infoPane}>
            <div style={styles.header}>
              <div>
                <h3 style={styles.title}>Send from your phone</h3>
                <p style={styles.desc}>
                  This copies the full phonebank setup to your mobile: contacts,
                  templates, dial code and extra channel settings.
                </p>
                {hostSessionEnabled && batches.length > 1 && (
                  <p style={styles.hostDesc}>
                    Hosting mode is on. Each participant scans only their own QR
                    code, then you move to the next participant.
                  </p>
                )}
              </div>
            </div>

            <ol style={styles.steps}>
              <li style={styles.step}>
                Open REACHOUT on your phone, or scan the QR code here with your
                normal camera app to open the scanner automatically.
              </li>
              <li style={styles.step}>Tap Scan data in the bottom menu.</li>
              <li style={styles.step}>Point your camera at the QR code.</li>
            </ol>

            {hostSessionEnabled && batches.length > 1 && (
              <div style={styles.batchControls}>
                <button
                  onClick={showPreviousBatch}
                  style={styles.navBtn}
                  disabled={currentBatchIndex === 0}
                >
                  <ChevronLeft size={16} />
                  <span style={styles.navBtnText}>
                    <span>Previous</span>
                    <span>participant</span>
                  </span>
                </button>
                <div style={styles.batchLabel}>
                  <span style={styles.batchTitle}>{currentBatch?.label}</span>
                  <span style={styles.batchMeta}>
                    {currentBatch?.contacts.length || 0} contacts
                  </span>
                </div>
                <button
                  onClick={showNextBatch}
                  style={styles.navBtn}
                  disabled={currentBatchIndex === batches.length - 1}
                >
                  <span style={styles.navBtnText}>
                    <span>Next</span>
                    <span>participant</span>
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <p style={styles.helperText}>
              {hostSessionEnabled && batches.length > 1
                ? " Once one participant has imported their data, move to the next participant."
                : ""}
            </p>

            <div style={styles.linkPanel}>
              <div>
                <span style={styles.linkTitle}>Share a unique link link</span>
                <p style={styles.linkText}>
                  Copy this compacted link and open it on your phone instead of
                  scanning the QR code. Anyone with the full link can open the
                  phonebank.
                </p>
              </div>
              {linkMessage && <p style={styles.linkWarning}>{linkMessage}</p>}
              {transferLinks.length === 0 && (
                <button
                  type="button"
                  disabled
                  style={{
                    ...styles.linkBtn,
                    ...styles.linkBtnDisabled,
                  }}
                >
                  <Link size={15} />
                  Preparing link
                </button>
              )}
              {transferLinks.map((link, index) => (
                <div key={`${link.url}-${index}`} style={styles.linkRow}>
                  <div style={styles.linkMeta}>
                    <span style={styles.linkName}>
                      Link {index + 1}
                      {transferLinks.length > 1
                        ? ` of ${transferLinks.length}`
                        : ""}
                    </span>
                    <span style={styles.linkLength}>
                      {link.url.length} / {MAX_TRANSFER_LINK_LENGTH} characters
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTransferLink(link.url, index)}
                    style={styles.linkBtn}
                  >
                    {linkStatus === `Link ${index + 1} copied.` ? (
                      <Check size={15} />
                    ) : (
                      <Link size={15} />
                    )}
                    Copy
                  </button>
                </div>
              ))}
              {linkStatus && <p style={styles.linkStatus}>{linkStatus}</p>}
            </div>
          </div>

          <div style={styles.qrPane}>
            <div style={styles.qrFrame}>
              {qrCodes[currentLinkIndex] ? (
                <img
                  src={qrCodes[currentLinkIndex]}
                  alt={`Transfer QR code ${currentLinkIndex + 1}`}
                  style={styles.qrImage}
                />
              ) : (
                <span style={styles.loading}>
                  {qrError || "Generating QR codes..."}
                </span>
              )}
            </div>

            <div style={styles.qrStatus}>
              <span style={styles.counter}>
                QR {qrCodes.length ? currentLinkIndex + 1 : 0} of{" "}
                {qrCodes.length}
              </span>
              {qrCodes.length > 1 && (
                <div style={styles.linkQrNav}>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentLinkIndex((index) => Math.max(0, index - 1))
                    }
                    disabled={currentLinkIndex === 0}
                    style={styles.smallNavBtn}
                  >
                    Previous link
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentLinkIndex((index) =>
                        Math.min(qrCodes.length - 1, index + 1)
                      )
                    }
                    disabled={currentLinkIndex === qrCodes.length - 1}
                    style={styles.smallNavBtn}
                  >
                    Next link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.68)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  modal: {
    width: "min(1040px, 100%)",
    maxHeight: "min(720px, calc(100dvh - 48px))",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "16px",
    padding: "22px",
    color: "var(--ta-cream)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
    position: "relative",
    overflow: "hidden",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 0.86fr) minmax(420px, 1.14fr)",
    gap: "22px",
    alignItems: "stretch",
  },
  infoPane: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingRight: "4px",
    overflowY: "auto",
  },
  qrPane: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "14px",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "24px",
    marginBottom: "4px",
  },
  desc: {
    color: "rgba(247,244,236,0.72)",
    fontSize: "13px",
    lineHeight: 1.45,
  },
  hostDesc: {
    color: "rgba(53,168,102,0.9)",
    fontSize: "12px",
    lineHeight: 1.4,
    marginTop: "6px",
  },
  steps: {
    display: "grid",
    gap: "8px",
    margin: "0 0 16px 18px",
    color: "rgba(247,244,236,0.8)",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  step: {
    paddingLeft: "4px",
  },
  batchControls: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    padding: "10px",
    border: "1px solid rgba(247,244,236,0.1)",
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  batchLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    minWidth: "120px",
  },
  batchTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "19px",
    letterSpacing: "0.05em",
  },
  batchMeta: {
    color: "rgba(247,244,236,0.58)",
    fontSize: "12px",
  },
  iconBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    zIndex: 2,
    width: "34px",
    height: "34px",
    background: "transparent",
    border: "1px solid rgba(247,244,236,0.22)",
    color: "var(--ta-cream)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrame: {
    backgroundColor: "var(--ta-cream)",
    borderRadius: "12px",
    minHeight: "min(560px, calc(100dvh - 164px))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    flex: 1,
  },
  qrImage: {
    width: "min(100%, 560px)",
    maxHeight: "min(560px, calc(100dvh - 188px))",
    aspectRatio: "1",
    objectFit: "contain",
  },
  loading: {
    color: "var(--ta-dark)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  qrStatus: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "16px",
  },
  linkQrNav: {
    display: "flex",
    gap: "8px",
  },
  smallNavBtn: {
    background: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.35)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "12px",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    minWidth: "92px",
    lineHeight: 1.05,
  },
  navBtnText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px",
  },
  counter: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "rgba(247,244,236,0.68)",
  },
  helperText: {
    marginTop: "auto",
    paddingTop: "14px",
    color: "rgba(247,244,236,0.58)",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  linkPanel: {
    marginTop: "14px",
    padding: "12px",
    border: "1px solid rgba(79, 159, 104, 0.22)",
    borderRadius: "10px",
    backgroundColor: "rgba(79, 159, 104, 0.07)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  linkTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "16px",
    letterSpacing: "0.05em",
  },
  linkText: {
    color: "rgba(247,244,236,0.66)",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  linkBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "13px",
    flexShrink: 0,
  },
  linkBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  linkLength: {
    color: "rgba(247,244,236,0.48)",
    fontSize: "11px",
  },
  linkWarning: {
    color: "rgba(247,244,236,0.72)",
    fontSize: "12px",
    lineHeight: 1.35,
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px",
    border: "1px solid rgba(247,244,236,0.08)",
    borderRadius: "8px",
    backgroundColor: "rgba(16,24,23,0.34)",
  },
  linkMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  linkName: {
    color: "var(--ta-cream)",
    fontSize: "12px",
    fontWeight: 700,
  },
  linkStatus: {
    color: "rgba(247,244,236,0.68)",
    fontSize: "12px",
  },
};
