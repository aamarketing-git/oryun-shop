interface ContactSellerProps {
  phone?: string;
  kakao?: string;
  telegram?: string;
  inquiryNumber?: string;
}

export function ContactSeller({ phone, kakao, telegram, inquiryNumber }: ContactSellerProps) {
  const channels: Array<{ icon: string; label: string; value: string; href: string }> = [];

  if (phone) channels.push({ icon: "📞", label: "전화", value: phone, href: `tel:${phone}` });
  if (kakao) channels.push({ icon: "💬", label: "카카오톡", value: kakao, href: kakao.startsWith("http") ? kakao : `https://open.kakao.com/${kakao}` });
  if (telegram) channels.push({ icon: "✈️", label: "텔레그램", value: telegram, href: telegram.startsWith("http") ? telegram : `https://t.me/${telegram.replace("@", "")}` });
  if (inquiryNumber) channels.push({ icon: "🔢", label: "문의번호", value: inquiryNumber, href: `tel:${inquiryNumber}` });

  if (channels.length === 0) {
    return <p className="text-sm text-muted-foreground">공급자가 연락처를 등록하지 않았습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {channels.map((c) => (
        <li key={c.label}>
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-applebrand hover:bg-applebrand/5 transition"
          >
            <span className="flex items-center gap-2 text-sm">
              <span>{c.icon}</span>
              <span className="text-muted-foreground">{c.label}</span>
            </span>
            <span className="text-sm font-medium">{c.value}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
