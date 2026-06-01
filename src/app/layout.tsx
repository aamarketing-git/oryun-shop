import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";

// 빈 문자열도 안전하게 처리 (?? 는 null/undefined만 처리하므로 .trim() 필요)
const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
const siteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : "http://localhost:3000";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "오륜쇼핑몰",
    template: "%s — 오륜쇼핑몰",
  },
  description: "행복은 선택이야 ~ 오륜쇼핑몰. 미니멀하고 신뢰할 수 있는 멀티벤더 마켓플레이스.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "오륜쇼핑몰",
    title: "오륜쇼핑몰",
    description: "행복은 선택이야 ~ 오륜쇼핑몰",
    images: [
      {
        url: "/og-image.png",
        width: 1376,
        height: 768,
        alt: "오륜쇼핑몰 — 행복은 선택이야",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "오륜쇼핑몰",
    description: "행복은 선택이야 ~ 오륜쇼핑몰",
    images: ["/og-image.png"],
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
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
