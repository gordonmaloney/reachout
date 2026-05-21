import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
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
  const chunksRef = useRef([]);
  const initialUrlProcessedRef = useRef(false);

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

      setContacts(reconstructed.contacts);
      setTemplates(reconstructed.templates);
      setSelectedDialCode(reconstructed.selectedDialCode);
      setExtraChannelsEnabled(reconstructed.extraChannelsEnabled);
      setCallNotes(reconstructed.callNotes || []);
      setReportBackSettings(reconstructed.reportBackSettings || { enabled: false, phone: "" });
      setProgress("All data imported.");
      setIsScanning(false);
      onImported?.();
      return true;
    },
    [
      onImported,
      setContacts,
      setExtraChannelsEnabled,
      setCallNotes,
      setReportBackSettings,
      setSelectedDialCode,
      setTemplates,
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
        (decodedText) => {
          const chunk = parseTransferChunk(decodedText);
          const completed = processChunk(chunk);
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
    processChunk,
  ]);

  return (
    <div style={styles.container} className="glass-card">
      <div style={styles.header}>
        <Camera size={22} color="var(--ta-green)" />
        <div>
          <h2 style={styles.title}>Scan data</h2>
          <p style={styles.desc}>
            Use this phone to scan the rotating QR codes shown on desktop.
          </p>
        </div>
      </div>

      <div style={styles.instructions}>
        <span style={styles.instructionTitle}>How to scan</span>
        <p style={styles.instructionText}>
          Keep the QR window open on the desktop. Tap Start scanning below. Your
          browser may ask for camera access: choose Allow, then point the camera
          at the desktop QR codes until the import completes.
        </p>
        <p style={styles.instructionText}>
          If you opened this page by scanning a QR code with your normal camera
          app, that first code has already been counted.
        </p>
      </div>

      <button
        onClick={() => setIsScanning((value) => !value)}
        style={styles.scanBtn}
        className="hover-lift"
      >
        {isScanning ? "Stop scanning" : "Start scanning"}
      </button>

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
};
