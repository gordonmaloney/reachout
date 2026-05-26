import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle } from "lucide-react";
import {
  isPasswordProtectedTransferLink,
  readEncryptedTransferLink,
} from "../linkTransferUtils";
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
  const [progress, setProgress] = useState(
    "Ready to scan QR codes from desktop."
  );
  const [importSummary, setImportSummary] = useState(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const chunksRef = useRef([]);
  const initialUrlProcessedRef = useRef(false);
  const readerShellRef = useRef(null);

  const scrollReaderIntoView = useCallback((behavior = "smooth") => {
    readerShellRef.current?.scrollIntoView({
      behavior,
      block: "start",
      inline: "nearest",
    });
  }, []);

  const importTransfer = useCallback(
    (reconstructed) => {
      setContacts(reconstructed.contacts);
      setTemplates(reconstructed.templates);
      setSelectedDialCode(reconstructed.selectedDialCode);
      setExtraChannelsEnabled(reconstructed.extraChannelsEnabled);
      setCallNotes(reconstructed.callNotes || []);
      setReportBackSettings({
        enabled: false,
        dialCode: "+44",
        phone: "",
        ...(reconstructed.reportBackSettings || {}),
      });
      setImportSummary({
        contactCount: reconstructed.contacts?.length || 0,
        templateCount: reconstructed.templates?.length || 0,
        hasReportBack: Boolean(reconstructed.reportBackSettings?.enabled),
      });
      setProgress("All data imported.");
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
        setProgress("That QR code is not Reachout transfer data.");
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
          let password = "";
          if (isPasswordProtectedTransferLink(url.hash)) {
            password =
              window.prompt(
                "This Reachout link is password protected. Enter the password shared by the organiser."
              ) || "";
            if (!password.trim()) {
              setProgress("Password needed to import this encrypted link.");
              return false;
            }
          }

          const imported = await readEncryptedTransferLink(url.hash, {
            password,
          });
          if (imported) return importTransfer(imported);
        }
      } catch (error) {
        if (error?.code === "PASSWORD_INCORRECT") {
          setProgress("That password did not unlock this QR link.");
          return false;
        }
        // Fall through to the invalid QR message below.
      }

      setProgress("That QR code is not Reachout transfer data.");
      return false;
    },
    [importTransfer, processChunk]
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
    let stopping = false;

    const stopScanner = async () => {
      if (!scanner || stopping) return;
      stopping = true;

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // The camera may already have stopped after a successful scan.
      }

      try {
        await scanner.clear();
      } catch {
        // Ignore cleanup failures from scanner internals.
      }
    };

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!active) return;

      setCameraStarting(true);
      setProgress("Starting the back camera...");
      scanner = new Html5Qrcode("reachout-reader", false);

      const config = {
        fps: 8,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.85);

          return {
            width: size,
            height: size,
          };
        },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const onScanSuccess = async (decodedText) => {
        const completed = await processDecodedText(decodedText);
        if (completed) {
          await stopScanner();
          setCameraStarting(false);
          setIsScanning(false);
        }
      };

      const onScanFailure = () => {};

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );
        setCameraStarting(false);
        setProgress("Camera ready. Point it at the QR code.");
        scrollReaderIntoView();
        window.setTimeout(scrollReaderIntoView, 180);
        window.setTimeout(scrollReaderIntoView, 420);
      } catch {
        try {
          setProgress("Finding an available back camera...");
          const cameras = await Html5Qrcode.getCameras();
          const backCamera =
            cameras.find((camera) =>
              /back|rear|environment/i.test(camera.label || "")
            ) || cameras[cameras.length - 1];

          if (!backCamera) {
            setProgress("No camera found on this device.");
            setIsScanning(false);
            return;
          }

          await scanner.start(
            { deviceId: { exact: backCamera.id } },
            config,
            onScanSuccess,
            onScanFailure
          );
          setCameraStarting(false);
          setProgress("Camera ready. Point it at the QR code.");
          scrollReaderIntoView();
          window.setTimeout(scrollReaderIntoView, 180);
          window.setTimeout(scrollReaderIntoView, 420);
        } catch {
          setCameraStarting(false);
          setProgress(
            "Could not start the camera. Check camera permission and try again."
          );
          setIsScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      setCameraStarting(false);
      stopScanner();
    };
  }, [isScanning, processDecodedText, scrollReaderIntoView]);

  useEffect(() => {
    if (!importSummary) return undefined;

    const timeout = window.setTimeout(() => {
      onImported?.();
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [importSummary, onImported]);

  useEffect(() => {
    if (!isScanning) return undefined;

    const frame = window.requestAnimationFrame(() => {
      scrollReaderIntoView();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isScanning, scrollReaderIntoView]);

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
          browser may ask for camera access: choose Allow, then point the back
          camera at the desktop QR code until the import completes.
        </p>
        <p style={styles.instructionText}>
          If you opened this page by scanning a QR code with your normal camera
          app, that first code has already been counted.
        </p>
        <p style={styles.instructionText}>
          Very large QR codes can be harder for the in-browser scanner to read.
          If it struggles to focus, try opening your phone's camera app directly
          and scanning from there instead.
        </p>
      </div>

      {importSummary && (
        <div style={styles.successOverlay}>
          <div style={styles.successModal}>
            <CheckCircle size={34} color="var(--ta-green)" />
            <span style={styles.successTitle}>Phonebank imported</span>
            <p style={styles.successText}>
              Loaded {importSummary.contactCount} contacts and{" "}
              {importSummary.templateCount} message templates
              {importSummary.hasReportBack ? ", with reportbacks enabled" : ""}.
            </p>
            <span style={styles.redirectText}>Opening contacts...</span>
            <span className="scan-success-progress" aria-hidden="true" />
          </div>
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

      {isScanning && (
        <div ref={readerShellRef} style={styles.readerShell}>
          <div id="reachout-reader" style={styles.reader} />
          {cameraStarting && (
            <div style={styles.readerLoading}>
              <span style={styles.readerLoadingTitle}>Starting camera</span>
              <span style={styles.readerLoadingText}>
                If asked, allow camera access.
              </span>
            </div>
          )}
        </div>
      )}
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
    fontSize: "calc(22px * var(--reachout-text-scale, 1))",
    margin: 0,
  },
  desc: {
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
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
    fontSize: "calc(16px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  instructionText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
    lineHeight: 1.4,
  },
  scanBtn: {
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
  },
  reader: {
    width: "100%",
    overflow: "hidden",
    borderRadius: "10px",
    border: "1px solid var(--ta-border-subtle)",
    backgroundColor: "var(--ta-dark-2)",
    minHeight: "280px",
  },
  readerShell: {
    position: "relative",
    width: "100%",
    minHeight: "280px",
    borderRadius: "10px",
    overflow: "hidden",
    scrollMarginTop: "8px",
  },
  readerLoading: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    backgroundColor: "var(--ta-dark-2)",
    border: "1px solid var(--ta-border-subtle)",
    borderRadius: "10px",
    color: "var(--ta-muted-strong)",
    textAlign: "center",
    pointerEvents: "none",
  },
  readerLoadingTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(18px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  readerLoadingText: {
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  progress: {
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    color: "var(--ta-muted-strong)",
  },
  successOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1400,
    backgroundColor: "var(--modal-overlay)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  successModal: {
    width: "min(320px, 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "10px",
    backgroundColor: "var(--modal-card-bg)",
    border: "1px solid rgba(79, 159, 104, 0.42)",
    borderRadius: "12px",
    padding: "22px 22px 25px",
    color: "var(--ta-cream)",
    boxShadow: "var(--modal-card-shadow)",
    backdropFilter: "blur(6px)",
    position: "relative",
    overflow: "hidden",
  },
  successTitle: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-green)",
    fontSize: "calc(20px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.05em",
  },
  successText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.4,
  },
  redirectText: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
    fontFamily: "var(--font-mono)",
  },
};
