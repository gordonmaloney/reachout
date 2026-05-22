const TRANSFER_PREFIX = "RO1";
const MAX_TEXT_CHUNK_SIZE = 320;
const MAX_CONTACT_CHUNK_SIZE = 3;

function splitText(value) {
  const text = String(value || "");
  const total = Math.max(1, Math.ceil(text.length / MAX_TEXT_CHUNK_SIZE));

  return Array.from({ length: total }, (_, index) =>
    text.slice(index * MAX_TEXT_CHUNK_SIZE, (index + 1) * MAX_TEXT_CHUNK_SIZE)
  );
}

export function createTransferChunks({
  contacts,
  templates,
  callNotes = [],
  reportBackSettings = { enabled: false, phone: "" },
  selectedDialCode,
  extraChannelsEnabled,
}) {
  const dataChunks = [
    {
      type: "meta",
      data: {
        selectedDialCode,
        extraChannelsEnabled: Boolean(extraChannelsEnabled),
        reportBackSettings: {
          enabled: Boolean(reportBackSettings.enabled),
          phone: reportBackSettings.phone || "",
          mandatory: Boolean(reportBackSettings.mandatory),
          questions: Array.isArray(reportBackSettings.questions)
            ? reportBackSettings.questions
            : [],
        },
      },
    },
  ];

  if (callNotes.length > 0) {
    dataChunks.push({
      type: "callNotes",
      data: callNotes,
    });
  }

  templates.forEach((template) => {
    splitText(template.body).forEach((bodyPart, bodyPartIndex, bodyParts) => {
      dataChunks.push({
        type: "template",
        templateId: template.id,
        title: template.title,
        bodyPartIndex: bodyPartIndex + 1,
        bodyParts: bodyParts.length,
        data: bodyPart,
      });
    });
  });

  for (let index = 0; index < contacts.length; index += MAX_CONTACT_CHUNK_SIZE) {
    dataChunks.push({
      type: "contacts",
      data: contacts.slice(index, index + MAX_CONTACT_CHUNK_SIZE),
    });
  }

  const totalParts = dataChunks.length;

  return dataChunks.map((chunk, index) => ({
    app: TRANSFER_PREFIX,
    v: 1,
    partIndex: index + 1,
    totalParts,
    ...chunk,
  }));
}

export function parseTransferChunk(value) {
  try {
    const text = String(value || "").trim();
    let chunkText = text;

    if (text.startsWith("http")) {
      const url = new URL(text);
      const dataParam = url.searchParams.get("data");
      if (!dataParam) return null;
      chunkText = decodeURIComponent(dataParam);
    }

    const parsed = JSON.parse(chunkText);

    if (
      parsed?.app !== TRANSFER_PREFIX ||
      parsed?.v !== 1 ||
      typeof parsed.partIndex !== "number" ||
      typeof parsed.totalParts !== "number" ||
      typeof parsed.type !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createTransferUrl(chunk) {
  const encodedData = encodeURIComponent(JSON.stringify(chunk));
  const fallbackUrl = new URL(window.location.href);
  fallbackUrl.search = "";
  fallbackUrl.hash = "";
  fallbackUrl.searchParams.set("scan", "1");
  fallbackUrl.searchParams.set("data", encodedData);

  return fallbackUrl.toString();
}

export function reconstructTransfer(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) return null;

  const totalParts = chunks[0].totalParts;
  const uniqueChunks = new Map();

  chunks.forEach((chunk) => {
    if (chunk.totalParts === totalParts) {
      uniqueChunks.set(chunk.partIndex, chunk);
    }
  });

  if (uniqueChunks.size !== totalParts) return null;

  try {
    const sortedChunks = Array.from(uniqueChunks.values()).sort(
      (a, b) => a.partIndex - b.partIndex
    );
    const contacts = [];
    let callNotes = [];
    const templateParts = new Map();
    let meta = {};

    sortedChunks.forEach((chunk) => {
      if (chunk.type === "meta" && chunk.data && typeof chunk.data === "object") {
        meta = chunk.data;
      }

      if (chunk.type === "contacts" && Array.isArray(chunk.data)) {
        contacts.push(...chunk.data);
      }

      if (chunk.type === "callNotes" && Array.isArray(chunk.data)) {
        callNotes = chunk.data;
      }

      if (chunk.type === "template") {
        const existing = templateParts.get(chunk.templateId) || {
          id: chunk.templateId,
          title: chunk.title || "Template",
          bodyParts: [],
        };

        existing.bodyParts[chunk.bodyPartIndex - 1] = String(chunk.data || "");
        templateParts.set(chunk.templateId, existing);
      }
    });

    return {
      contacts,
      templates: Array.from(templateParts.values()).map((template) => ({
        id: template.id,
        title: template.title,
        body: template.bodyParts.join(""),
      })),
      callNotes,
      selectedDialCode: meta.selectedDialCode || "+44",
      extraChannelsEnabled: Boolean(meta.extraChannelsEnabled),
      reportBackSettings: meta.reportBackSettings || { enabled: false, phone: "" },
    };
  } catch {
    return null;
  }
}
