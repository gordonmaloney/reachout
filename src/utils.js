export const dialCodeOptions = [
  { label: 'UK (+44)', value: '+44' },
  { label: 'Ireland (+353)', value: '+353' },
  { label: 'USA / Canada (+1)', value: '+1' },
  { label: 'France (+33)', value: '+33' },
  { label: 'Germany (+49)', value: '+49' },
  { label: 'Spain (+34)', value: '+34' },
  { label: 'Italy (+39)', value: '+39' },
  { label: 'Australia (+61)', value: '+61' },
  { label: 'New Zealand (+64)', value: '+64' },
];

function getFirstName(contact) {
  return contact.name.split(' ')[0];
}

function personalizeMessage(contact, template) {
  return template.body.replace(/\{FIRSTNAME\}/g, getFirstName(contact));
}

function stripWhatsAppFormatting(message) {
  return message.replace(/[*_]/g, '');
}

function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

export function normalizePhoneNumber(phone, dialCode = '+44') {
  const raw = String(phone || '').trim();
  const selectedCodeDigits = digitsOnly(dialCode);
  const knownCodeDigits = dialCodeOptions.map((option) => digitsOnly(option.value));

  if (!raw) return '';

  if (raw.startsWith('+')) {
    return `+${digitsOnly(raw)}`;
  }

  const compact = raw.replace(/[\s().-]/g, '');
  if (compact.startsWith('00')) {
    return `+${digitsOnly(compact.slice(2))}`;
  }

  const phoneDigits = digitsOnly(raw);
  const matchingCode = knownCodeDigits
    .filter((code) => phoneDigits.startsWith(code) && phoneDigits.length > code.length + 5)
    .sort((a, b) => b.length - a.length)[0];

  if (matchingCode) {
    return `+${phoneDigits}`;
  }

  const localDigits = phoneDigits.replace(/^0+/, '');
  return `+${selectedCodeDigits}${localDigits}`;
}

export function getWhatsAppPhoneNumber(phone, dialCode = '+44') {
  return digitsOnly(normalizePhoneNumber(phone, dialCode));
}

export function getOutboundMessage(contact, template, { plainText = false } = {}) {
  const message = personalizeMessage(contact, template);
  return plainText ? stripWhatsAppFormatting(message) : message;
}

export function generateWhatsAppLink(contact, template, dialCode = '+44') {
  const base = 'https://wa.me/';
  const phone = getWhatsAppPhoneNumber(contact.phone, dialCode);
  const text = encodeURIComponent(personalizeMessage(contact, template));
  return `${base}${phone}?text=${text}`;
}

export function generateSmsLink(contact, template, dialCode = '+44') {
  const base = 'sms:';
  const phone = normalizePhoneNumber(contact.phone, dialCode);
  const body = encodeURIComponent(getOutboundMessage(contact, template, { plainText: true }));
  return `${base}${phone}&body=${body}`;
}

export function generateSignalLink(contact, dialCode = '+44') {
  return `https://signal.me/#p/${encodeURIComponent(normalizePhoneNumber(contact.phone, dialCode))}`;
}

export function generateTelegramLink(contact, dialCode = '+44') {
  return `tg://resolve?phone=${digitsOnly(normalizePhoneNumber(contact.phone, dialCode))}`;
}

export function generatePreview(contact, template) {
  return personalizeMessage(contact, template);
}

export function generateCallLink(contact, dialCode = '+44') {
  const phone = normalizePhoneNumber(contact.phone, dialCode);
  return `tel:${phone}`;
}
