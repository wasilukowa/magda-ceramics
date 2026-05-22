import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Magda Ceramics",
  description: "Handmade functional ceramics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="bg-[var(--background)]">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-1 max-w-[1200px] mx-auto w-full">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
