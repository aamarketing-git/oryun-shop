import { createServiceClient } from '@/lib/supabase/server';
import { formatKRW } from '@/lib/utils';
import StatsCharts from '@/components/admin/StatsCharts';

export default async function AdminStatsPage() {
  const supabase = createServiceClient();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const { data: orders } = await supabase
    .from('orders')
    .select('total_krw, status, payment_method, created_at, seller_id, sellers(business_name)')
    .gte('created_at', since30.toISOString());

  const paid = (orders ?? []).filter((o) =>
    ['paid', 'preparing', 'shipping', 'delivered'].includes(o.status),
  );

  const totalRevenue = paid.reduce((s, o) => s + Number(o.total_krw), 0);
  const totalOrders = paid.length;
  const usdtCount = paid.filter((o) => o.payment_method === 'usdt').length;
  const bankCount = paid.filter((o) => o.payment_method === 'bank_transfer').length;

  // 일별 매출
  const byDay = new Map<string, number>();
  paid.forEach((o) => {
    const d = new Date(o.created_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + Number(o.total_krw));
  });
  const daily = Array.from(byDay.entries())
    .sort()
    .map(([date, revenue]) => ({ date: date.slice(5), revenue }));

  // 공급자별 매출
  const bySeller = new Map<string, number>();
  paid.forEach((o: any) => {
    const name = o.sellers?.business_name ?? '미상';
    bySeller.set(name, (bySeller.get(name) ?? 0) + Number(o.total_krw));
  });
  const sellerRanking = Array.from(bySeller.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">통계</h1>
      <p className="mt-1 text-sm text-gray-500">최근 30일</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="총 매출" value={formatKRW(totalRevenue)} />
        <Stat label="결제완료 주문" value={String(totalOrders)} />
        <Stat label="USDT 결제" value={String(usdtCount)} />
        <Stat label="계좌이체 결제" value={String(bankCount)} />
      </div>

      <div className="mt-10">
        <StatsCharts daily={daily} sellerRanking={sellerRanking} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
