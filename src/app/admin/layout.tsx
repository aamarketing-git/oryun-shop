import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import {
  LayoutDashboard, Users, Store, Package, ShoppingCart,
  DollarSign, Hash, Truck, MessageSquare, BarChart3
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/users", label: "회원관리", icon: Users },
  { href: "/admin/sellers", label: "공급자 승인", icon: Store },
  { href: "/admin/products", label: "상품관리", icon: Package },
  { href: "/admin/orders", label: "주문관리", icon: ShoppingCart },
  { href: "/admin/settings/rate", label: "환율 설정", icon: DollarSign },
  { href: "/admin/txids", label: "TXID 관리", icon: Hash },
  { href: "/admin/shipments", label: "배송관리", icon: Truck },
  { href: "/admin/inquiries", label: "문의 조회", icon: MessageSquare },
  { href: "/admin/stats", label: "통계", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-muted">
      {/* 모바일 — 상단 가로 스크롤 탭 */}
      <div className="md:hidden bg-white border-b border-border sticky top-14 z-30">
        <div className="px-3 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
            오륜 Admin
          </p>
        </div>
        <nav className="h-scroll px-3 pb-2" style={{ paddingTop: 0 }}>
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full bg-gray-100 hover:bg-gray-200 whitespace-nowrap transition"
              style={{ flexShrink: 0 }}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* PC — 좌측 사이드바 */}
      <div className="flex">
        <aside className="hidden md:block w-60 bg-background border-r border-border min-h-screen p-6 sticky top-12 self-start">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">오륜 Admin</p>
            <p className="text-lg font-semibold mt-1">관리자 센터</p>
          </div>
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => (
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
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
