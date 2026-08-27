import { Montserrat } from "next/font/google";
import "../globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-[var(--background)]">{children}</body>
    </html>
  );
}
