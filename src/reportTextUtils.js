import { normalizePhoneNumber } from "./utils";

export function formatReportDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function getOptOutChannels(optOut = {}) {
  const channels = [];
  if (optOut.calls) channels.push("calls");
  if (optOut.texts) channels.push("messages");
  return channels;
}

export function hasOptOut(optOut = {}) {
  return getOptOutChannels(optOut).length > 0;
}

export function getReportRows(contacts, contactReports, selectedDialCode, questions) {
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
      optOut: report.optOut || {},
    };
  });
}

export function getReportPlainText(rows) {
  const lines = rows.map((row) => {
    const answers = row.questions.map((question) => {
      const answer = row.answers[question.id] || "not recorded";
      return `${question.label}: ${answer}`;
    });
    const date = formatReportDate(row.date) || "date not recorded";
    const optOutCalls = row.optOut.calls ? "yes" : "no";
    const optOutTexts = row.optOut.texts ? "yes" : "no";
    return `${row.name} (${row.phone}) - ${answers.join("; ")}; Opt out of calls: ${optOutCalls}; Opt out of messages: ${optOutTexts}; Date: ${date}`;
  });

  return `Reachout reportback\n\n${lines.join("\n")}`;
}

export function getReportSpreadsheetText(rows, questions) {
  const header = [
    "Name",
    "Phone",
    ...questions.map((question) => question.label),
    "Opt out of calls",
    "Opt out of messages",
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
    row.optOut.calls ? "yes" : "",
    row.optOut.texts ? "yes" : "",
    formatReportDate(row.date),
  ]);

  return [header, ...body]
    .map((row) =>
      row.map((cell) => String(cell || "").replace(/\t/g, " ")).join("\t")
    )
    .join("\n");
}

export function getOptOutRows(contacts, contactReports, selectedDialCode) {
  return contacts
    .map((contact) => {
      const report = contactReports[contact.id] || {};
      return {
        name: contact.name,
        phone: normalizePhoneNumber(contact.phone, selectedDialCode),
        optOut: report.optOut || {},
      };
    })
    .filter((row) => hasOptOut(row.optOut));
}

export function getOptOutPlainText(rows) {
  const lines = rows.map((row) => {
    const channels = getOptOutChannels(row.optOut).join(" and ");
    const date = formatReportDate(row.optOut.date) || "date not recorded";
    return `${row.name} (${row.phone}) - opted out of ${channels}; Date: ${date}`;
  });

  return `Reachout opt-outs\n\n${lines.join("\n")}`;
}
