import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle } from "lucide-react";
import { readEncryptedTransferLink } from "../linkTransferUtils";
import { parseTransferChunk, reconstructTransfer } from "../transferUtils";

export default function MobileDataScanner({
  setContacts,
  setTemplates,
  setSelectedDialCode,
  setExtraChannelsEnabled,
  setCallNotes = () => {},
  setReportBackSettings = () => {},
  onImported,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState("Ready to scan QR codes from desktop.");
  const [importSummary, setImportSummary] = useState(null);
  const chunksRef = useRef([]);
  const initialUrlProcessedRef = useRef(false);

  const importTransfer = useCallback(
    (reconstructed) => {
      setContacts(reconstructed.contacts);
      setTemplates(reconstructed.templates);
      setSelectedDialCode(reconstructed.selectedDialCode);
      setExtraChannelsEnabled(reconstructed.extraChannelsEnabled);
      setCallNotes(reconstructed.callNotes || []);
      setReportBackSettings(reconstructed.reportBackSettings || { enabled: false, phone: "" });
      setImportSummary({
        contactCount: reconstructed.contacts?.length || 0,
        templateCount: reconstructed.templates?.length || 0,
        hasReportBack: Boolean(reconstructed.reportBackSettings?.enabled),
      });
      setProgress("All data imported.");
      setIsScanning(false);
      return true;
    },
    [
      setCallNotes,
      setContacts,
      setExtraChannelsEnabled,
      setReportBackSettings,
      setSelectedDialCode,
      setTemplates,
    ]
  );

  const processChunk = useCallback(
    (chunk) => {
      if (!chunk) {
        setProgress("That QR code is not REACHOUT transfer data.");
        return false;
      }

      const exists = chunksRef.current.some(
        (existing) => existing.partIndex === chunk.partIndex
      );

      if (!exists) {
        chunksRef.current = [...chunksRef.current, chunk];
      }

      setProgress(
        `Scanned ${chunksRef.current.length} of ${chunk.totalParts} QR codes.`
      );

      const reconstructed = reconstructTransfer(chunksRef.current);
      if (!reconstructed) return false;

      return importTransfer(reconstructed);
    },
    [importTransfer]
  );

  const processDecodedText = useCallback(
    async (decodedText) => {
      const chunk = parseTransferChunk(decodedText);
      if (chunk) return processChunk(chunk);

      try {
        const url = new URL(decodedText);
        if (url.hash) {
          const imported = await readEncryptedTransferLink(url.hash);
          if (imported) return importTransfer(imported);
        }
      } catch {
        // Fall through to the invalid QR message below.
      }

      setProgress("That QR code is not REACHOUT transfer data.");
      return false;
    },
    [
      importTransfer,
      processChunk,
    ]
  );

  useEffect(() => {
    if (initialUrlProcessedRef.current) return;
    initialUrlProcessedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");
    if (!dataParam) return;

    window.setTimeout(() => {
      const chunk = parseTransferChunk(window.location.href);
      const completed = processChunk(chunk);
      if (!completed && chunk) {
        setProgress(
          `First QR captured. Tap Start scanning, allow camera access, then keep scanning until you reach ${chunk.totalParts} of ${chunk.totalParts}.`
        );
      }
    }, 0);
  }, [processChunk]);

  useEffect(() => {
    if (!isScanning) return undefined;

    let scanner;
    let active = true;

    async function startScanner() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (!active) return;

      scanner = new Html5QrcodeScanner(
        "reachout-reader",
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          const completed = await processDecodedText(decodedText);
          if (completed) scanner.clear().catch(() => {});
        },
        () => {}
      );
    }

    startScanner();

    return () => {
      active = false;
      scanner?.clear().catch(() => {});
    };
  }, [
    isScanning,
    processDecodedText,
  ]);

  return (
    <div style={styles.container} className="glass-card">
      <div style={styles.header}>
        <Camera size={22} color="var(--ta-green)" />
        <div>
          <h2 style={styles.title}>Scan data</h2>
          <p style={styles.desc}>
            Use this phone to scan the QR code shown on desktop.
          </p>
        </div>
      </div>

      <div style={styles.instructions}>
        <span style={styles.instructionTitle}>How to scan</span>
        <p style={styles.instructionText}>
          Keep the QR window open on the desktop. Tap Start scanning below. Your
          browser may ask for camera access: choose Allow, then point the camera
          at the desktop QR code until the import completes.
        </p>
        <p style={styles.instructionText}>
          If you opened this page by scanning a QR code with your normal camera
          app, that first code has already been counted.
        </p>
      </div>

      {importSummary && (
        <div style={styles.successBox}>
          <CheckCircle size={24} color="var(--ta-green)" />
          <div style={styles.successCopy}>
            <span style={styles.successTitle}>Phonebank imported</span>
            <p style={styles.successText}>
              Loaded {importSummary.contactCount} contacts and{" "}
              {importSummary.templateCount} message templates
              {importSummary.hasReportBack ? ", with reportbacks enabled" : ""}.
            </p>
          </div>
          <button type="button" onClick={onImported} style={styles.continueBtn}>
            Start phonebanking
          </button>
        </div>
      )}

      {!importSummary && (
        <button
          onClick={() => setIsScanning((value) => !value)}
          style={styles.scanBtn}
          className="hover-lift"
        >
          {isScanning ? "Stop scanning" : "Start scanning"}
        </button>
      )}

      {isScanning && <div id="reachout-reader" style={styles.reader} />}
      <p style={styles.progress}>{progress}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100%",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    color: "var(--ta-cream)",
  },
  header: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "22px",
    margin: 0,
  },
  desc: {
    fontSize: "13px",
    color: "rgba(247,244,236,0.68)",
    lineHeight: 1.4,
  },
  instructions: {
    backgroundColor: "rgba(79, 159, 104, 0.08)",
    border: "1px solid rgba(79, 159, 104, 0.2)",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  instructionTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "16px",
    letterSpacing: "0.05em",
  },
  instructionText: {
    fontSize: "12px",
    color: "rgba(247,244,236,0.72)",
    lineHeight: 1.4,
  },
  scanBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "15px",
  },
  reader: {
    width: "100%",
    overflow: "hidden",
    borderRadius: "10px",
  },
  progress: {
    fontSize: "13px",
    color: "rgba(247,244,236,0.72)",
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "rgba(79, 159, 104, 0.1)",
    border: "1px solid rgba(79, 159, 104, 0.32)",
    borderRadius: "12px",
    padding: "14px",
  },
  successCopy: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  successTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "20px",
    letterSpacing: "0.05em",
  },
  successText: {
    color: "rgba(247,244,236,0.74)",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  continueBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "15px",
  },
};
