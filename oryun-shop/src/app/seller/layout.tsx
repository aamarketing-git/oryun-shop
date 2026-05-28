import Link from "next/link";
import { requireSeller } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingCart, LayoutDashboard, Settings, MessageSquare } from "lucide-react";

const SELLER_NAV = [
  { href: "/seller/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/seller/products", label: "내 상품", icon: Package },
  { href: "/seller/orders", label: "주문 관리", icon: ShoppingCart },
  { href: "/seller/inquiries", label: "문의", icon: MessageSquare },
  { href: "/seller/settings", label: "정보 수정", icon: Settings },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  await requireSeller();

  // 공급자 본인의 status 체크 → pending이면 안내 페이지
  const supabase = createClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("status")
    .single();

  if (seller?.status === "pending") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">승인 대기 중</h1>
          <p className="text-muted-foreground">
            공급자 신청이 관리자의 승인을 기다리고 있습니다. 승인 완료 시 이메일로 안내드립니다.
          </p>
        </div>
      </div>
    );
  }

  if (seller?.status === "rejected" || seller?.status === "blocked") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">접근 제한</h1>
          <p className="text-muted-foreground">
            공급자 활동이 제한되었습니다. 자세한 사항은 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="flex">
        <aside className="w-60 bg-background border-r border-border min-h-screen p-6 sticky top-12 self-start">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">오륜 Seller</p>
            <p className="text-lg font-semibold mt-1">공급자 센터</p>
          </div>
          <nav className="space-y-1">
            {SELLER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
