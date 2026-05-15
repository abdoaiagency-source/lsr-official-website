import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "الإقامة الآمنة الليبية للخدمات العمالية",
  description:
    "حلول متكاملة لإدارة شؤون العمالة الوافدة في ليبيا: الإقامات، العقود، الاستقدام، الامتثال، والدعم اللوجستي.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
