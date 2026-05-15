import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "الإقامة الآمنة الليبية للخدمات العمالية",
  description:
    "حلول متكاملة لإدارة شؤون العمالة الوافدة في ليبيا: الإقامات، العقود، الاستقدام، الامتثال، والدعم اللوجستي.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={ibmPlexSansArabic.variable}>{children}</body>
    </html>
  );
}
