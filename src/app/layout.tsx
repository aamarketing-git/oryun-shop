import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// 빈 문자열도 안전하게 처리 (?? 는 null/undefined만 처리하므로 .trim() 필요)
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
const siteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "오륜쇼핑몰",
    template: "%s — 오륜쇼핑몰",
  },
  description: "오륜쇼핑몰 — A new way to shop. 미니멀하고 신뢰할 수 있는 멀티벤더 마켓플레이스.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "오륜쇼핑몰",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
