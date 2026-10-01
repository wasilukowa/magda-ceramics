// Domena: poczta wychodząca. Nadawcę dokłada serwis (lib/service/mail),
// bo jest jeden dla całego sklepu.

// Załącznik: treść zakodowana w base64, tak jak przyjmuje ją Resend.
export type MailAttachment = {
  filename: string;
  content: string;
  contentType: string;
};

export type MailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  // Adres, na który trafi odpowiedź klienta — skrzynka pracowni, nie nadawca.
  replyTo?: string;
  attachments?: MailAttachment[];
};
