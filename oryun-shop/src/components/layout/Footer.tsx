import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "쇼핑",
    links: [
      { href: "/products", label: "전체 상품" },
      { href: "/products?category=digital", label: "디지털" },
      { href: "/products?category=staking", label: "스테이킹" },
    ],
  },
  {
    title: "지원",
    links: [
      { href: "/support/shipping", label: "배송 안내" },
      { href: "/support/payment", label: "결제 안내 (계좌이체/USDT)" },
      { href: "/support/faq", label: "FAQ" },
    ],
  },
  {
    title: "오륜 정보",
    links: [
      { href: "/about", label: "회사 소개" },
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
    ],
  },
  {
    title: "공급자",
    links: [
      { href: "/auth/register?role=seller", label: "공급자 신청" },
      { href: "/seller/dashboard", label: "공급자 센터" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-muted mt-24 text-[12px] text-muted-foreground">
      <div className="apple-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-foreground font-medium mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:underline underline-offset-2">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p>© {new Date().getFullYear()} 오륜쇼핑몰. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">이용약관</Link>
            <Link href="/privacy" className="hover:underline">개인정보</Link>
            <Link href="/contact" className="hover:underline">문의</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
