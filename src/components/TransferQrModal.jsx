import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Link,
  Maximize2,
  X,
} from "lucide-react";
import {
  createCompactTransferLinks,
} from "../linkTransferUtils";

export default function TransferQrModal({
  contacts,
  templates,
  selectedDialCode,
  extraChannelsEnabled,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  linkPasswordProtected = false,
  linkPassword = "",
  hostSessionEnabled = false,
  hostSessionCallers = 1,
  theme = "dark",
  fontScale = 1,
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
  const [isPreparingTransfer, setIsPreparingTransfer] = useState(true);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [linkStatus, setLinkStatus] = useState("");
  const [qrError, setQrError] = useState("");
  const [fullscreenQrOpen, setFullscreenQrOpen] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const activePassword = linkPasswordProtected ? linkPassword.trim() : "";
  const currentBatch = batches[currentBatchIndex] || batches[0];
  const currentTransfer = batchTransfers[currentBatchIndex] || {};
  const transferLinks = currentTransfer.links || [];
  const linkMessage = currentTransfer.message || "";
  const qrCodes = batchQrCodes[currentBatchIndex] || [];
  const currentQrLink = transferLinks[currentLinkIndex];
  const currentBatchContactCount = currentBatch?.contacts.length || 0;
  const isSplitTransfer = transferLinks.length > 1 || currentTransfer.wasSplit;
  const hasMultipleLinks = transferLinks.length > 1;
  const currentBatchStart =
    batches
      .slice(0, currentBatchIndex)
      .reduce((total, batch) => total + (batch.contacts?.length || 0), 0) + 1;
  const currentBatchEnd = Math.min(
    contacts.length,
    currentBatchStart + currentBatchContactCount - 1
  );
  const participantProgress =
    batches.length > 1
      ? `${currentBatchIndex + 1} of ${batches.length}`
      : "1 of 1";
  const isTransferReady =
    !isPreparingTransfer &&
    !qrError &&
    batchTransfers.length === batches.length &&
    batchQrCodes.length === batches.length &&
    batchQrCodes.every((codes) => codes.length > 0);

  const getLinkContactSummary = (link) => {
    const count = link?.contactCount ?? 0;
    const total = currentBatchContactCount || count;
    const suffix =
      hostSessionEnabled && batches.length > 1 ? " for this participant" : "";

    return `Contains ${count}/${total} contacts${suffix}`;
  };

  useEffect(() => {
    let cancelled = false;

    async function generateTransfers() {
      try {
        setIsPreparingTransfer(true);
        setQrError("");
        setBatchTransfers([]);
        setBatchQrCodes([]);

        if (linkPasswordProtected && !activePassword) {
          setBatchTransfers([]);
          setBatchQrCodes([]);
          setQrError("Add a password to generate encrypted links.");
          setIsPreparingTransfer(false);
          return;
        }

        const QRCode = await import("qrcode");
        const nextTransfers = await Promise.all(
          batches.map((batch) =>
            createCompactTransferLinks(
              {
                contacts: batch.contacts || [],
                templates,
                callNotes,
                reportBackSettings,
                selectedDialCode,
                extraChannelsEnabled,
              },
              undefined,
              activePassword ? { password: activePassword } : {}
            )
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
          setIsPreparingTransfer(false);
        }
      } catch {
        if (!cancelled) {
          setBatchTransfers([]);
          setBatchQrCodes([]);
          setQrError(
            "This transfer is too large to fit cleanly in a QR code. Try copying the link below, or shorten the message templates."
          );
          setIsPreparingTransfer(false);
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
    activePassword,
    linkPasswordProtected,
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
    const copiedMessage = hasMultipleLinks ? `Link ${index + 1} copied.` : "Link copied.";

    try {
      await navigator.clipboard.writeText(url);
      setLinkStatus(copiedMessage);
    } catch {
      setLinkStatus("Copy failed. Select and copy the link manually.");
    }
  };

  const copyPassword = async () => {
    if (!activePassword) return;

    try {
      await navigator.clipboard.writeText(activePassword);
      setPasswordStatus("Password copied.");
    } catch {
      setPasswordStatus("Copy failed. Select and copy the password manually.");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && fullscreenQrOpen) {
        event.preventDefault();
        setFullscreenQrOpen(false);
        return;
      }

      if (!hostSessionEnabled || batches.length <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentBatchIndex((index) => Math.max(0, index - 1));
        setCurrentLinkIndex(0);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentBatchIndex((index) => Math.min(batches.length - 1, index + 1));
        setCurrentLinkIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [batches.length, fullscreenQrOpen, hostSessionEnabled]);

  const modalContent = (
    <div
      style={{
        ...styles.overlay,
        ...(fullscreenQrOpen ? styles.overlayFullscreenActive : {}),
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...styles.modal,
          ...(fullscreenQrOpen ? styles.modalBehindFullscreen : {}),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onClose} style={styles.iconBtn} title="Close">
          <X size={18} />
        </button>

        {!isTransferReady ? (
          <div style={styles.loadingLayout}>
            <div style={styles.loadingCard}>
              {!qrError && <span style={styles.loadingSpinner} />}
              <span style={styles.loadingTitle}>
                {qrError ? "Could not prepare transfer" : "Preparing QR code and link"}
              </span>
              <p style={styles.loadingText}>
                {qrError ||
                  "Encrypting and packaging the phonebank so it is ready to open on mobile."}
              </p>
            </div>
          </div>
        ) : (
        <div style={styles.layout}>
          <div style={styles.infoPane}>
            <div style={styles.header}>
              <div>
                <h3 style={styles.title}>Send from your phone</h3>
                <p style={styles.desc}>
                  This prepares the phonebank so it can be opened on a mobile:
                  contacts, messages and any organiser options you have added.
                </p>
                {hostSessionEnabled && batches.length > 1 && (
                  <p style={styles.hostDesc}>
                    Hosting mode is on. Each participant should use only their
                    own QR code or link, then you move to the next participant.
                  </p>
                )}
              </div>
            </div>

            <ol style={styles.steps}>
              <li style={styles.step}>
                Open the link on your phone, or scan the QR code with your
                phone's normal camera.
              </li>
              <li style={styles.step}>
                Both methods open the same phonebank on mobile. Anyone with the
                QR code or full link can open it
                {activePassword ? " if they also have the password" : ""}, so
                only share it with people taking part.
              </li>
            </ol>

            {hostSessionEnabled && batches.length > 1 && (
              <div style={styles.participantPanel}>
                <div style={styles.participantHeader}>
                  <span style={styles.participantKicker}>
                    Participant {participantProgress}
                  </span>
                  <span style={styles.participantCount}>
                    {currentBatchContactCount} contact
                    {currentBatchContactCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={styles.participantBody}>
                  <div style={styles.participantCopy}>
                    <span style={styles.participantTitle}>
                      {currentBatch?.label}
                    </span>
                    <span style={styles.participantText}>
                      The QR code and link below are only for this participant.
                    </span>
                    <span style={styles.participantRange}>
                      Contacts {currentBatchStart}-{currentBatchEnd} of{" "}
                      {contacts.length}
                    </span>
                  </div>
                  <div style={styles.participantNav}>
                    <button
                      type="button"
                      onClick={showPreviousBatch}
                      style={{
                        ...styles.navBtn,
                        ...(currentBatchIndex === 0 ? styles.navBtnDisabled : {}),
                      }}
                      disabled={currentBatchIndex === 0}
                    >
                      <ChevronLeft size={15} />
                      Previous
                    </button>
                    <div style={styles.participantDots} aria-hidden="true">
                      {batches.map((batch, index) => (
                        <span
                          key={batch.label}
                          style={{
                            ...styles.participantDot,
                            ...(index === currentBatchIndex
                              ? styles.participantDotActive
                              : {}),
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={showNextBatch}
                      style={{
                        ...styles.navBtn,
                        ...(currentBatchIndex === batches.length - 1
                          ? styles.navBtnDisabled
                          : {}),
                      }}
                      disabled={currentBatchIndex === batches.length - 1}
                    >
                      Next
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.linkPanel}>
              <div>
                <span style={styles.linkTitle}>Share a unique link</span>
                <p style={styles.linkText}>
                  Copy this link and send it somewhere you can open on your
                  phone. When opened, it loads this phonebank on mobile.
                </p>
              </div>
              {activePassword && (
                <div style={styles.passwordLinkWarning}>
                  <p style={styles.passwordLinkWarningText}>
                    This link is encrypted. Send the password separately as
                    well, or the recipient will not be able to open it.
                  </p>
                  <button
                    type="button"
                    onClick={copyPassword}
                    style={styles.passwordCopyBtn}
                  >
                    Copy password
                  </button>
                  {passwordStatus && (
                    <span style={styles.passwordStatus}>{passwordStatus}</span>
                  )}
                </div>
              )}
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
                <div
                  key={`${link.url}-${index}`}
                  style={{
                    ...styles.linkRow,
                    ...(!hasMultipleLinks && !isSplitTransfer ? styles.linkRowSingle : {}),
                  }}
                >
                  {(hasMultipleLinks || isSplitTransfer) && (
                    <div style={styles.linkMeta}>
                      {hasMultipleLinks && (
                        <span style={styles.linkName}>
                          Link {index + 1} of {transferLinks.length}
                        </span>
                      )}
                      {isSplitTransfer && (
                        <span style={styles.linkContactSummary}>
                          {getLinkContactSummary(link)}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => copyTransferLink(link.url, index)}
                    style={{
                      ...styles.linkBtn,
                      ...(!hasMultipleLinks && !isSplitTransfer ? styles.linkBtnFull : {}),
                    }}
                  >
                    {linkStatus === (hasMultipleLinks ? `Link ${index + 1} copied.` : "Link copied.") ? (
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
            <div style={styles.qrIntro}>
              <span style={styles.qrTitle}>Scan the QR code</span>
              <p style={styles.qrText}>
                Use the phone's normal camera app. It will open the mobile
                phonebank automatically.
              </p>
            </div>
            <div style={styles.qrFrame}>
              {qrCodes[currentLinkIndex] ? (
                <img
                  src={qrCodes[currentLinkIndex]}
                  alt={
                    qrCodes.length > 1
                      ? `Transfer QR code ${currentLinkIndex + 1}`
                      : "Transfer QR code"
                  }
                  style={styles.qrImage}
                />
              ) : (
                <span style={styles.loading}>
                  {qrError || "Generating QR codes..."}
                </span>
              )}
            </div>
            {qrCodes[currentLinkIndex] && (
              <button
                type="button"
                onClick={() => setFullscreenQrOpen(true)}
                style={styles.fullscreenQrBtn}
              >
                <Maximize2 size={14} />
                Make QR full screen
              </button>
            )}

            {(qrCodes.length > 1 || (isSplitTransfer && currentQrLink)) && (
              <div style={styles.qrStatus}>
                {qrCodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentLinkIndex((index) => Math.max(0, index - 1))
                    }
                    disabled={currentLinkIndex === 0}
                    style={{ ...styles.smallNavBtn, justifySelf: "start" }}
                  >
                    Prev link
                  </button>
                )}
                <div style={styles.qrStatusSummary}>
                  {qrCodes.length > 1 && (
                    <span style={styles.counter}>
                      QR {currentLinkIndex + 1} of {qrCodes.length}
                    </span>
                  )}
                  {isSplitTransfer && currentQrLink && (
                    <span style={styles.qrContactSummary}>
                      {getLinkContactSummary(currentQrLink)}
                    </span>
                  )}
                </div>
                {qrCodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentLinkIndex((index) =>
                        Math.min(qrCodes.length - 1, index + 1)
                      )
                    }
                    disabled={currentLinkIndex === qrCodes.length - 1}
                    style={{ ...styles.smallNavBtn, justifySelf: "end" }}
                  >
                    Next link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      {fullscreenQrOpen && qrCodes[currentLinkIndex] && (
        <div
          style={styles.fullscreenOverlay}
          role="presentation"
          onClick={(event) => {
            event.stopPropagation();
            setFullscreenQrOpen(false);
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFullscreenQrOpen(false);
            }}
            style={styles.fullscreenCloseBtn}
            aria-label="Close full-screen QR code"
          >
            <X size={22} />
          </button>
          <div
            style={styles.fullscreenQrShell}
          >
            <img
              src={qrCodes[currentLinkIndex]}
              alt={
                qrCodes.length > 1
                  ? `Full-screen transfer QR code ${currentLinkIndex + 1}`
                  : "Full-screen transfer QR code"
              }
              style={styles.fullscreenQrImage}
              onClick={(event) => event.stopPropagation()}
            />
            <span
              style={styles.fullscreenQrCaption}
              onClick={(event) => event.stopPropagation()}
            >
              {hostSessionEnabled && batches.length > 1
                ? `${currentBatch?.label} · `
                : ""}
              {qrCodes.length > 1
                ? `QR ${currentLinkIndex + 1} of ${qrCodes.length}`
                : "Scan with the phone camera"}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenQrOpen(false);
              }}
              style={styles.fullscreenCloseTextBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const themedModalContent = (
    <div
      className="reachout-theme-scope"
      data-theme={theme}
      style={{ "--reachout-text-scale": fontScale }}
    >
      {modalContent}
    </div>
  );

  if (typeof document === "undefined") return themedModalContent;
  return createPortal(themedModalContent, document.body);
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor:
      "color-mix(in srgb, var(--ta-cream) 10%, var(--modal-overlay))",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 2147483000,
    padding: "calc(24px + env(safe-area-inset-top)) 24px 24px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    isolation: "isolate",
  },
  overlayFullscreenActive: {
    zIndex: 2147483000,
  },
  modal: {
    width: "min(1020px, 100%)",
    maxHeight: "calc(100dvh - 48px - env(safe-area-inset-top))",
    margin: "auto 0",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(244, 239, 228, 0.24)",
    borderRadius: "16px",
    padding: "22px",
    color: "var(--ta-cream)",
    boxShadow:
      "0 28px 90px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(79, 159, 104, 0.22), 0 0 42px rgba(79, 159, 104, 0.16)",
    position: "relative",
    overflow: "hidden",
  },
  modalBehindFullscreen: {
    filter: "blur(8px)",
    transform: "scale(0.995)",
    pointerEvents: "none",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 0.95fr) minmax(340px, 1.05fr)",
    gap: "18px",
    alignItems: "stretch",
    minHeight: 0,
    maxHeight: "calc(100dvh - 92px - env(safe-area-inset-top))",
  },
  infoPane: {
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    paddingRight: "4px",
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
  qrPane: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  qrIntro: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    marginBottom: "12px",
  },
  qrTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  qrText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "10px",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(24px * var(--reachout-text-scale, 1))",
    marginBottom: "4px",
  },
  desc: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
  },
  hostDesc: {
    color: "var(--ta-link-green)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
    marginTop: "6px",
  },
  steps: {
    display: "grid",
    gap: "5px",
    margin: "0 0 10px 18px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  step: {
    paddingLeft: "4px",
  },
  passwordCopyBtn: {
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "999px",
    backgroundColor: "transparent",
    color: "var(--ta-green)",
    padding: "7px 10px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  passwordStatus: {
    margin: 0,
    color: "var(--ta-green)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  participantPanel: {
    marginBottom: "8px",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "12px",
    backgroundColor: "rgba(79, 159, 104, 0.07)",
    overflow: "hidden",
  },
  participantHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "7px 10px",
    borderBottom: "1px solid rgba(79, 159, 104, 0.18)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
  },
  participantKicker: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  participantCount: {
    color: "var(--ta-cream)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  participantBody: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "9px 10px 10px",
  },
  participantCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  participantTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "calc(19px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    lineHeight: 1,
  },
  participantText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.25,
  },
  participantRange: {
    alignSelf: "flex-start",
    marginTop: "2px",
    border: "1px solid rgba(79, 159, 104, 0.24)",
    borderRadius: "999px",
    color: "var(--ta-green)",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    padding: "3px 7px",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  participantNav: {
    display: "grid",
    gridTemplateColumns: "minmax(82px, 1fr) auto minmax(82px, 1fr)",
    alignItems: "center",
    gap: "8px",
  },
  participantDots: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    maxWidth: "96px",
    overflow: "hidden",
  },
  participantDot: {
    width: "5px",
    height: "5px",
    borderRadius: "999px",
    backgroundColor: "rgba(244, 239, 228, 0.28)",
    flexShrink: 0,
  },
  participantDotActive: {
    width: "16px",
    backgroundColor: "var(--ta-green)",
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
  loadingLayout: {
    minHeight: "min(420px, calc(100dvh - 120px))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
  },
  loadingCard: {
    width: "min(420px, 100%)",
    border: "1px solid rgba(79, 159, 104, 0.28)",
    borderRadius: "14px",
    backgroundColor: "var(--surface-subtle)",
    color: "var(--ta-cream)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "24px",
    textAlign: "center",
  },
  loadingSpinner: {
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "3px solid rgba(79, 159, 104, 0.2)",
    borderTopColor: "var(--ta-green)",
    animation: "qr-loading-spin 0.8s linear infinite",
  },
  loadingTitle: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
    lineHeight: 1,
  },
  loadingText: {
    margin: 0,
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  qrFrame: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    flex: "0 1 auto",
  },
  qrImage: {
    width: "min(100%, 430px, calc(100dvh - 210px))",
    maxHeight: "min(430px, calc(100dvh - 210px))",
    aspectRatio: "1",
    objectFit: "contain",
  },
  fullscreenQrBtn: {
    alignSelf: "center",
    marginTop: "10px",
    border: "1px solid rgba(79, 159, 104, 0.45)",
    borderRadius: "999px",
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    color: "var(--ta-green)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "8px 12px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
  },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483001,
    backgroundColor: "rgba(0, 0, 0, 0.74)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "calc(24px + env(safe-area-inset-top)) 24px 24px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    isolation: "isolate",
  },
  fullscreenCloseBtn: {
    position: "fixed",
    top: "calc(18px + env(safe-area-inset-top))",
    right: "18px",
    zIndex: 2147483002,
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    border: "1px solid rgba(17, 24, 18, 0.18)",
    backgroundColor: "#ffffff",
    color: "#111812",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.34)",
  },
  fullscreenQrShell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    width: "min(92vw, 86dvh)",
    minHeight: "calc(100dvh - 72px - env(safe-area-inset-top))",
    justifyContent: "center",
    padding: "48px 0 16px",
  },
  fullscreenQrImage: {
    width: "min(86vw, calc(100dvh - 190px - env(safe-area-inset-top)), 70dvh)",
    height: "min(86vw, calc(100dvh - 190px - env(safe-area-inset-top)), 70dvh)",
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    objectFit: "contain",
    boxShadow: "0 24px 90px rgba(0, 0, 0, 0.55)",
  },
  fullscreenQrCaption: {
    color: "#111812",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(17, 24, 18, 0.16)",
    borderRadius: "999px",
    padding: "8px 13px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
    textAlign: "center",
    boxShadow: "0 10px 26px rgba(0, 0, 0, 0.28)",
  },
  fullscreenCloseTextBtn: {
    border: "1px solid rgba(17, 24, 18, 0.16)",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
    color: "#111812",
    padding: "10px 22px",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.3)",
  },
  loading: {
    color: "#151d17",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  qrStatus: {
    display: "grid",
    gridTemplateColumns: "minmax(78px, 1fr) auto minmax(78px, 1fr)",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "10px",
  },
  qrStatusSummary: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    textAlign: "center",
    minWidth: 0,
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
    padding: "6px 8px",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    whiteSpace: "nowrap",
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
    padding: "8px 10px",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 800,
    lineHeight: 1,
    minWidth: 0,
  },
  navBtnDisabled: {
    opacity: 0.38,
    cursor: "not-allowed",
  },
  counter: {
    fontFamily: "var(--font-mono)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
  },
  qrContactSummary: {
    color: "var(--ta-green)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  linkPanel: {
    marginTop: "0",
    padding: "12px",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "12px",
    backgroundColor: "var(--surface-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  linkTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  linkText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  passwordLinkWarning: {
    margin: 0,
    border: "1px solid rgba(211, 106, 88, 0.34)",
    borderRadius: "8px",
    backgroundColor: "rgba(211, 106, 88, 0.1)",
    color: "var(--ta-red)",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  passwordLinkWarningText: {
    margin: 0,
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
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
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    flexShrink: 0,
  },
  linkBtnFull: {
    width: "100%",
  },
  linkBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  linkContactSummary: {
    color: "var(--ta-green)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  linkWarning: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    lineHeight: 1.35,
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "8px",
    backgroundColor: "var(--surface-raised)",
  },
  linkRowSingle: {
    justifyContent: "center",
  },
  linkMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  linkName: {
    color: "var(--ta-cream)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontWeight: 700,
  },
  linkStatus: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
};
