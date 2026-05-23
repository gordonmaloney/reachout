import { Check, Copy, MessageCircle, Send, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { getWhatsAppPhoneNumber, normalizePhoneNumber } from "../utils";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getRows(contacts, contactReports, selectedDialCode, questions) {
  return contacts.map((contact) => {
    const report = contactReports[contact.id] || {};
    const answers = report.answers || {
      pickedUp: report.pickedUp || "",
      notes: report.notes || "",
    };
    return {
      name: contact.name,
      phone: normalizePhoneNumber(contact.phone, selectedDialCode),
      answers,
      date: report.date || "",
      questions,
    };
  });
}

function getPlainText(rows) {
  const lines = rows.map((row) => {
    const answers = row.questions.map((question) => {
      const answer = row.answers[question.id] || "not recorded";
      return `${question.label}: ${answer}`;
    });
    const date = formatDate(row.date) || "date not recorded";
    return `${row.name} (${row.phone}) - ${answers.join("; ")}; Date: ${date}`;
  });

  return `REACHOUT reportback\n\n${lines.join("\n")}`;
}

function getSpreadsheetText(rows, questions) {
  const header = [
    "Name",
    "Phone",
    ...questions.map((question) => question.label),
    "Date",
  ];
  const body = rows.map((row) => [
    row.name,
    row.phone,
    ...questions.map((question) =>
      String(row.answers[question.id] || "")
        .replace(/\s+/g, " ")
        .trim()
    ),
    formatDate(row.date),
  ]);

  return [header, ...body]
    .map((row) =>
      row.map((cell) => String(cell || "").replace(/\t/g, " ")).join("\t")
    )
    .join("\n");
}

export default function MobileReportBackCard({
  contacts,
  contactReports,
  reportBackSettings,
  selectedDialCode,
}) {
  const [copied, setCopied] = useState("");
  const questions = useMemo(
    () =>
      reportBackSettings.questions?.filter((question) =>
        question.label?.trim()
      ) || [],
    [reportBackSettings.questions]
  );
  const rows = useMemo(
    () => getRows(contacts, contactReports, selectedDialCode, questions),
    [contacts, contactReports, questions, selectedDialCode]
  );
  const plainText = useMemo(() => getPlainText(rows), [rows]);
  const spreadsheetText = useMemo(
    () => getSpreadsheetText(rows, questions),
    [questions, rows]
  );
  const organiserPhone = normalizePhoneNumber(
    reportBackSettings.phone,
    selectedDialCode
  );
  const whatsappPhone = getWhatsAppPhoneNumber(
    reportBackSettings.phone,
    selectedDialCode
  );
  const whatsappLink = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    plainText
  )}`;
  const smsLink = `sms:${organiserPhone}&body=${encodeURIComponent(plainText)}`;
  const recordedCount = contacts.filter(
    (contact) => contactReports[contact.id]?.contacted
  ).length;

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => {
        setCopied((current) => (current === label ? "" : current));
      }, 1600);
    } catch {
      // Clipboard can be unavailable in some browsers.
    }
  };

  return (
    <div style={styles.card} className="glass-card">
      <div>
        <CheckCircle size={42} color="var(--ta-green)" />
        <h2 style={styles.title}>You’re finished - now report back</h2>
        <p style={styles.text}>
          Send your organiser a summary of how your calls went using the buttons
          below - just click and send.
        </p>
      </div>
      {/*
      <div style={styles.summary}>
        <span>
          {recordedCount} of {contacts.length} contacts recorded
        </span>
        {organiserPhone && <span>Send to {organiserPhone}</span>}
      </div>
      */}
      <div style={styles.actions}>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.primaryBtn}
          className="message-link-action hover-lift"
        >
          <MessageCircle size={16} />
          WhatsApp report
        </a>
        <a href={smsLink} className="message-link-action hover-lift">
          <Send size={16} />
          SMS report
        </a>
        <button
          type="button"
          onClick={() => copyText(spreadsheetText, "spreadsheet")}
          style={styles.secondaryBtn}
        >
          {copied === "spreadsheet" ? <Check size={16} /> : <Copy size={16} />}
          Copy full report
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  eyebrow: {
    color: "var(--ta-green)",
    fontFamily: "var(--font-mono)",
    fontSize: "calc(11px * var(--reachout-text-scale, 1))",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--ta-cream)",
    fontSize: "calc(28px * var(--reachout-text-scale, 1))",
    margin: "4px 0 6px",
  },
  text: {
    color: "var(--ta-muted-strong)",
    fontSize: "calc(13px * var(--reachout-text-scale, 1))",
    lineHeight: 1.45,
    margin: 0,
  },
  summary: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    border: "1px solid rgba(79, 159, 104, 0.22)",
    backgroundColor: "rgba(79, 159, 104, 0.07)",
    borderRadius: "8px",
    padding: "10px",
    color: "var(--ta-muted-strong)",
    fontSize: "calc(12px * var(--reachout-text-scale, 1))",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "var(--ta-green)",
    color: "var(--ta-dark)",
    borderRadius: "8px",
    padding: "10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(15px * var(--reachout-text-scale, 1))",
    textDecoration: "none",
  },
  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "1px solid rgba(79, 159, 104, 0.4)",
    color: "var(--ta-green)",
    borderRadius: "8px",
    padding: "10px",
    fontFamily: "var(--font-heading)",
    fontSize: "calc(14px * var(--reachout-text-scale, 1))",
    textDecoration: "none",
  },
};
