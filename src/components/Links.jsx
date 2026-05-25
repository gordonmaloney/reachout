import { useState } from 'react';
import { Check, Clipboard, MessageCircle, MessageSquare, Send } from 'lucide-react';
import {
  generatePreview,
  generateSignalLink,
  generateSmsLink,
  generateTelegramLink,
  generateWhatsAppLink,
  getOutboundMessage,
} from '../utils';

function WhatsAppMark({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12.04 3.5a8.43 8.43 0 0 0-7.18 12.85l-.87 3.15 3.24-.85a8.42 8.42 0 1 0 4.81-15.15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.9 8.15c.2-.43.38-.44.56-.44h.48c.16 0 .38.06.58.49.2.48.66 1.58.72 1.7.06.12.1.27.02.43-.1.18-.16.27-.31.43l-.24.26c-.11.11-.23.23-.1.47.13.24.58.95 1.24 1.54.85.75 1.56.99 1.8 1.1.23.12.37.1.5-.06.16-.18.58-.67.73-.9.16-.23.31-.2.52-.12.22.08 1.38.65 1.62.77.24.12.4.18.46.28.06.1.06.6-.14 1.17-.2.57-1.17 1.08-1.63 1.12-.42.04-.95.06-1.54-.1-.36-.1-.82-.26-1.41-.52-2.48-1.07-4.1-3.56-4.22-3.73-.12-.17-1-1.33-1-2.54 0-1.2.63-1.8.86-2.05Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Links({ contact, template, dialCode, extraChannelsEnabled }) {
  const whatsappLink = generateWhatsAppLink(contact, template, dialCode);
  const smsLink = generateSmsLink(contact, template, dialCode);
  const signalLink = generateSignalLink(contact, dialCode);
  const telegramLink = generateTelegramLink(contact, dialCode);
  const preview = generatePreview(contact, template);
  const previewText = preview.trim();
  const hasMessageText = previewText.length > 0;
  const [copied, setCopied] = useState('');

  const markCopied = (type) => {
    setCopied(type);
    window.setTimeout(() => setCopied((current) => (current === type ? '' : current)), 1600);
  };

  const copyToClipboard = async (value, type) => {
    try {
      await navigator.clipboard.writeText(value);
      markCopied(type);
    } catch {
      // Clipboard writes can fail on older browsers or non-gesture contexts.
    }
  };

  const copyPlainMessage = async () => {
    try {
      await navigator.clipboard.writeText(getOutboundMessage(contact, template, { plainText: true }));
      markCopied('message');
    } catch {
      // Some mobile browsers only allow clipboard writes after opening the app.
    }
  };

  return (
    <div className="message-link-card">
      <div className="message-link-copy">
        <span className="message-link-title">{template.title}</span>
        {hasMessageText && (
          <button
            type="button"
            onClick={() => copyToClipboard(getOutboundMessage(contact, template, { plainText: true }), 'message')}
            className="message-link-preview"
            title="Copy message text"
          >
            {copied === 'message' ? <Check size={13} /> : <Clipboard size={13} />}
            <span>{previewText}</span>
          </button>
        )}
      </div>
      <div className="message-link-actions">
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="message-link-action hover-lift">
          <WhatsAppMark size={14} /> WhatsApp
        </a>
        <a href={smsLink} target="_blank" rel="noopener noreferrer" className="message-link-action hover-lift">
          <MessageSquare size={14} /> SMS
        </a>
        {extraChannelsEnabled && (
          <>
            <a href={signalLink} target="_blank" rel="noopener noreferrer" onClick={copyPlainMessage} className="message-link-action hover-lift">
              <MessageCircle size={14} /> Signal
            </a>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="message-link-action hover-lift">
              <Send size={14} /> Telegram
            </a>
          </>
        )}
      </div>
    </div>
  );
}
