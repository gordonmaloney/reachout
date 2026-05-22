const LINK_PREFIX = "ro";
const LINK_VERSION = 1;
export const MAX_TRANSFER_LINK_LENGTH = 2000;

function bytesToBase64Url(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function compressBytes(bytes) {
  if (!("CompressionStream" in window)) {
    return { bytes, compression: "none" };
  }

  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return { bytes: compressed, compression: "gzip" };
}

async function decompressBytes(bytes, compression) {
  if (compression === "none") return bytes;

  if (compression !== "gzip" || !("DecompressionStream" in window)) {
    throw new Error("This browser cannot decompress this transfer link.");
  }

  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function compactTransferData(data) {
  return {
    c: (data.contacts || []).map((contact) => [
      contact.name || "",
      contact.phone || "",
    ]),
    t: (data.templates || []).map((template) => [
      template.id || "",
      template.title || "",
      template.body || "",
    ]),
    n: (data.callNotes || []).map((note) => [
      note.id || "",
      note.text || "",
    ]),
    r: [
      data.reportBackSettings?.enabled ? 1 : 0,
      data.reportBackSettings?.phone || "",
      (data.reportBackSettings?.questions || []).map((question) => [
        question.id || "",
        question.label || "",
        question.type || "text",
      ]),
      data.reportBackSettings?.mandatory ? 1 : 0,
    ],
    d: data.selectedDialCode || "+44",
    e: data.extraChannelsEnabled ? 1 : 0,
  };
}

function expandTransferData(data) {
  if (!data || !Array.isArray(data.c) || !Array.isArray(data.t)) {
    return data;
  }

  return {
    contacts: data.c.map((contact, index) => ({
      id: `c_link_${index}_${Math.random().toString(36).slice(2, 8)}`,
      name: contact[0] || "",
      phone: contact[1] || "",
    })),
    templates: data.t.map((template, index) => ({
      id: template[0] || `t_link_${index}`,
      title: template[1] || "Template",
      body: template[2] || "",
    })),
    callNotes: (data.n || []).map((note, index) => ({
      id: note[0] || `note_link_${index}`,
      text: note[1] || "",
    })),
    reportBackSettings: {
      enabled: Boolean(data.r?.[0]),
      phone: data.r?.[1] || "",
      questions: (data.r?.[2] || []).map((question, index) => ({
        id: question[0] || `question_link_${index}`,
        label: question[1] || "",
        type: question[2] || "text",
      })),
      mandatory: Boolean(data.r?.[3]),
    },
    selectedDialCode: data.d || "+44",
    extraChannelsEnabled: Boolean(data.e),
  };
}

function getLinkDataFromHash(hashValue = window.location.hash) {
  const hash = String(hashValue || "").replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get(LINK_PREFIX);
}

export function hasTransferLink(hashValue = window.location.hash) {
  return Boolean(getLinkDataFromHash(hashValue));
}

export async function createCompactTransferLink(data) {
  const encoded = new TextEncoder().encode(
    JSON.stringify({
      v: LINK_VERSION,
      d: compactTransferData(data),
    })
  );
  const compressed = await compressBytes(encoded);

  const transfer = {
    v: LINK_VERSION,
    c: compressed.compression,
    d: bytesToBase64Url(compressed.bytes),
  };
  const token = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(transfer)));
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = `${LINK_PREFIX}=${token}`;

  return {
    url: url.toString(),
    compression: compressed.compression,
  };
}

async function createLinkForContacts(data, contacts) {
  return createCompactTransferLink({
    ...data,
    contacts,
  });
}

export async function createCompactTransferLinks(data, maxLength = MAX_TRANSFER_LINK_LENGTH) {
  const contacts = data.contacts || [];
  const templateOnlyLink = await createLinkForContacts(data, []);

  if (templateOnlyLink.url.length > maxLength) {
    return {
      links: [
        {
          ...templateOnlyLink,
          contactCount: 0,
        },
      ],
      wasSplit: false,
      overLimit: true,
      message:
        "The templates alone make the link too long. Shorten the templates or use QR transfer instead.",
    };
  }

  const fullLink = await createLinkForContacts(data, contacts);
  if (fullLink.url.length <= maxLength) {
    return {
      links: [
        {
          ...fullLink,
          contactCount: contacts.length,
        },
      ],
      wasSplit: false,
      overLimit: false,
    };
  }

  const links = [];
  let startIndex = 0;

  while (startIndex < contacts.length) {
    let low = 1;
    let high = contacts.length - startIndex;
    let bestCount = 1;
    let bestLink = await createLinkForContacts(data, contacts.slice(startIndex, startIndex + 1));

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidateContacts = contacts.slice(startIndex, startIndex + mid);
      const candidate = await createLinkForContacts(data, candidateContacts);

      if (candidate.url.length <= maxLength) {
        bestCount = mid;
        bestLink = candidate;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    links.push({
      ...bestLink,
      contactCount: bestCount,
    });
    startIndex += bestCount;
  }

  return {
    links,
    wasSplit: true,
    overLimit: links.some((link) => link.url.length > maxLength),
    message:
      "There is a limit to how many contacts can go in one link, so contacts have been split into batches. Each link includes all templates.",
  };
}

export const createEncryptedTransferLink = createCompactTransferLink;

export async function readEncryptedTransferLink(hashValue = window.location.hash) {
  const token = getLinkDataFromHash(hashValue);
  if (!token) return null;

  const transfer = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
  const iv = transfer.i || transfer.iv;
  const keyBytes = transfer.k || transfer.key;
  const encodedData = transfer.d || transfer.data;
  const compression = transfer.c || transfer.cmp || "none";

  if (transfer?.v !== LINK_VERSION || !encodedData) {
    throw new Error("This is not a valid REACHOUT transfer link.");
  }

  let compressedBytes;
  if (iv && keyBytes) {
    const key = await crypto.subtle.importKey(
      "raw",
      base64UrlToBytes(keyBytes),
      "AES-GCM",
      false,
      ["decrypt"]
    );
    compressedBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: base64UrlToBytes(iv),
        },
        key,
        base64UrlToBytes(encodedData)
      )
    );
  } else {
    compressedBytes = base64UrlToBytes(encodedData);
  }

  const decompressed = await decompressBytes(compressedBytes, compression);
  const payload = JSON.parse(new TextDecoder().decode(decompressed));

  if (payload?.v !== LINK_VERSION || (!payload.d && !payload.data)) {
    throw new Error("This transfer link has the wrong format.");
  }

  return expandTransferData(payload.d || payload.data);
}
