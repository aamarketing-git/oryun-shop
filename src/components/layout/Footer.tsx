import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "쇼핑",
    links: [
      { href: "/products", label: "전체 상품" },
      { href: "/products?category=health", label: "건강(식품)" },
      { href: "/products?category=cosmetics", label: "화장품" },
      { href: "/products?category=living", label: "생활용품" },
      { href: "/products?category=etc", label: "기타" },
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

        {/* 고객센터 정보 */}
        <div className="bg-white rounded-2xl p-5 mb-8 border border-border">
          <h4 className="text-foreground font-semibold mb-3 text-sm">📞 고객센터</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
            <div>
              <p className="text-muted-foreground mb-0.5">전화</p>
              <a href="tel:010-3559-7297" className="text-foreground font-semibold hover:text-[#3182F6]">
                010-3559-7297
              </a>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">이메일</p>
              <a href="mailto:aamarketing250611@gmail.com" className="text-foreground font-semibold hover:text-[#3182F6] break-all">
                aamarketing250611@gmail.com
              </a>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">상담 시간</p>
              <p className="text-foreground font-semibold">평일 10:00 ~ 18:00<br/>(점심 12:00~13:00)</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            제품·배송·결제 관련 문의는 위 연락처로 부탁드립니다.
          </p>
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
