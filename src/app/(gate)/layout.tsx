import { Montserrat } from "next/font/google";
import "../globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    // Zaślepka jest zaprojektowana na jasno (białe panele na zdjęciu) i zniknie
    // przy otwarciu sklepu, więc trybu ciemnego tu nie ma — także wtedy, gdy
    // urządzenie klienta jest ciemne.
    <html lang="en" className={montserrat.variable} data-theme="light">
      <body className="bg-[var(--background)]">{children}</body>
    </html>
  );
}
