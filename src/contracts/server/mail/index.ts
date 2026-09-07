// Domena: poczta wychodząca. Nadawcę dokłada serwis (lib/service/mail),
// bo jest jeden dla całego sklepu.

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};
