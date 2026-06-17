const LINK_PREFIX = "ro";
const LINK_VERSION = 1;
const SHARE_LINK_PATH = "/s";
const PASSWORD_KDF_ITERATIONS = 150000;
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

function makeTransferError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function derivePasswordKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_KDF_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
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
    ne: data.callNotesEnabled ? 1 : 0,
    r: [
      data.reportBackSettings?.enabled ? 1 : 0,
      data.reportBackSettings?.phone || "",
      (data.reportBackSettings?.questions || []).map((question) => [
        question.id || "",
        question.label || "",
        question.type || "text",
        question.mandatory ? 1 : 0,
      ]),
      data.reportBackSettings?.mandatory ? 1 : 0,
      data.reportBackSettings?.dialCode || "+44",
    ],
    d: data.selectedDialCode || "+44",
    e: data.extraChannelsEnabled ? 1 : 0,
    cn: data.callerNameTokenEnabled ? 1 : 0,
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
    callNotesEnabled: Boolean(data.ne ?? (data.n || []).length),
    reportBackSettings: {
      enabled: Boolean(data.r?.[0]),
      phone: data.r?.[1] || "",
      questions: (data.r?.[2] || []).map((question, index) => ({
        id: question[0] || `question_link_${index}`,
        label: question[1] || "",
        type: question[2] || "text",
        mandatory: Boolean(question[3]),
      })),
      mandatory: Boolean(data.r?.[3]),
      dialCode: data.r?.[4] || "+44",
    },
    selectedDialCode: data.d || "+44",
    extraChannelsEnabled: Boolean(data.e),
    callerNameTokenEnabled: Boolean(data.cn),
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

export function generateSecureTransferPassword() {
  return bytesToBase64Url(getRandomBytes(18));
}

export function isPasswordProtectedTransferLink(hashValue = window.location.hash) {
  const token = getLinkDataFromHash(hashValue);
  if (!token) return false;

  try {
    const transfer = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
    return Boolean(transfer.p);
  } catch {
    return false;
  }
}

export async function createCompactTransferLink(data, options = {}) {
  const encoded = new TextEncoder().encode(
    JSON.stringify({
      v: LINK_VERSION,
      d: compactTransferData(data),
    })
  );
  const compressed = await compressBytes(encoded);
  const password = options.password?.trim();

  let transfer;
  if (password) {
    const salt = getRandomBytes(8);
    const iv = getRandomBytes(12);
    const key = await derivePasswordKey(password, salt);
    const encrypted = new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        key,
        compressed.bytes
      )
    );

    transfer = {
      v: LINK_VERSION,
      c: compressed.compression,
      p: 1,
      s: bytesToBase64Url(salt),
      i: bytesToBase64Url(iv),
      d: bytesToBase64Url(encrypted),
    };
  } else {
    transfer = {
      v: LINK_VERSION,
      c: compressed.compression,
      d: bytesToBase64Url(compressed.bytes),
    };
  }

  const token = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(transfer)));
  const url = new URL(window.location.href);
  url.pathname = SHARE_LINK_PATH;
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
  }, data.__linkOptions || {});
}

export async function createCompactTransferLinks(
  data,
  maxLength = MAX_TRANSFER_LINK_LENGTH,
  options = {}
) {
  const contacts = data.contacts || [];
  const dataWithOptions = {
    ...data,
    __linkOptions: options,
  };
  const templateOnlyLink = await createLinkForContacts(dataWithOptions, []);

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

  const fullLink = await createLinkForContacts(dataWithOptions, contacts);
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
    let bestLink = await createLinkForContacts(dataWithOptions, contacts.slice(startIndex, startIndex + 1));

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const candidateContacts = contacts.slice(startIndex, startIndex + mid);
      const candidate = await createLinkForContacts(dataWithOptions, candidateContacts);

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
      "This phonebank is too large for one compact link, so the contacts have been split into batches. Each link includes all templates and only the contacts shown for that batch.",
  };
}

export const createEncryptedTransferLink = createCompactTransferLink;

export async function readEncryptedTransferLink(
  hashValue = window.location.hash,
  options = {}
) {
  const token = getLinkDataFromHash(hashValue);
  if (!token) return null;

  const transfer = JSON.parse(new TextDecoder().decode(base64UrlToBytes(token)));
  const iv = transfer.i || transfer.iv;
  const keyBytes = transfer.k || transfer.key;
  const salt = transfer.s || transfer.salt;
  const passwordProtected = Boolean(transfer.p);
  const encodedData = transfer.d || transfer.data;
  const compression = transfer.c || transfer.cmp || "none";

  if (transfer?.v !== LINK_VERSION || !encodedData) {
    throw makeTransferError("This is not a valid REACHOUT transfer link.", "INVALID_TRANSFER_LINK");
  }

  let compressedBytes;
  if (passwordProtected) {
    const password = options.password?.trim();
    if (!password) {
      throw makeTransferError(
        "This REACHOUT link is password protected.",
        "PASSWORD_REQUIRED"
      );
    }
    if (!iv || !salt) {
      throw makeTransferError("This protected link is missing security data.", "INVALID_TRANSFER_LINK");
    }

    try {
      const key = await derivePasswordKey(password, base64UrlToBytes(salt));
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
    } catch {
      throw makeTransferError(
        "That password did not unlock this REACHOUT link.",
        "PASSWORD_INCORRECT"
      );
    }
  } else if (iv && keyBytes) {
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
    throw makeTransferError("This transfer link has the wrong format.", "INVALID_TRANSFER_LINK");
  }

  return expandTransferData(payload.d || payload.data);
}
