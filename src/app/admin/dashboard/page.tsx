import { createServiceClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { ShoppingCart, Users, Store, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createServiceClient(); // 관리자 페이지에선 RLS 우회로 전체 통계 집계
  // 7일 통계
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [{ count: customerCnt }, { count: sellerPending }, { count: productPending }, { data: revenueRows }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("sellers").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("total_krw, total_usdt, status, created_at").gte("created_at", since).in("status", ["paid","preparing","shipping","delivered"]),
  ]);

  const totalKrw = revenueRows?.reduce((sum, r) => sum + Number(r.total_krw ?? 0), 0) ?? 0;
  const usdtCount = revenueRows?.filter((r) => r.total_usdt).length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">대시보드</h1>
      <p className="text-sm text-muted-foreground mb-8">최근 7일 기준</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="7일 매출" value={formatKRW(totalKrw)} />
        <StatCard icon={ShoppingCart} label="USDT 거래 건수" value={`${usdtCount}건`} />
        <StatCard icon={Store} label="승인 대기 공급자" value={`${sellerPending ?? 0}명`} highlight={Boolean(sellerPending)} />
        <StatCard icon={Users} label="승인 대기 상품" value={`${productPending ?? 0}개`} highlight={Boolean(productPending)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">최근 주문</h2>
          <RecentOrders />
        </div>
        <div className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">바로가기</h2>
          <div className="space-y-2 text-sm">
            <QuickLink href="/admin/sellers?status=pending">공급자 승인 대기 →</QuickLink>
            <QuickLink href="/admin/products?status=pending">상품 승인 대기 →</QuickLink>
            <QuickLink href="/admin/txids?status=pending">TXID 검증 대기 →</QuickLink>
            <QuickLink href="/admin/settings/rate">USDT 환율 변경 →</QuickLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, highlight,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-background border rounded-xl p-5 ${highlight ? "border-applebrand" : "border-border"}`}>
      <Icon className="h-5 w-5 text-muted-foreground mb-3" />
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

async function RecentOrders() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select("order_number, total_krw, status, created_at, customer:profiles!orders_customer_id_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">주문이 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {data.map((o) => (
        <li key={o.order_number} className="py-2 text-sm flex justify-between">
          <span className="font-mono text-xs">{o.order_number}</span>
          <span className="text-muted-foreground">{formatKRW(Number(o.total_krw))}</span>
        </li>
      ))}
    </ul>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} className="block py-1 link-apple">{children}</a>;
}
