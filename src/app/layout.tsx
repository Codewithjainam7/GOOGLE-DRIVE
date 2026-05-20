import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "IntegrateFlow — Google Drive Dashboard",
  description:
    "Enterprise-grade Google Drive integration dashboard. Connect, authenticate, and manage your Google Drive files securely with folder-level access control.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen safe-top safe-bottom`}>{children}</body>
    </html>
  );
}
