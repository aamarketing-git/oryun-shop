import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatKRW, formatDate } from '@/lib/utils';

export default async function SellerDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('*').eq('user_id', user.id).single();
  // 공급자 신청 자체가 없으면 신청 페이지로
  if (!seller) redirect('/auth/register?role=seller');
  // 승인 안 된 상태면 대기 페이지로 (pending/rejected/blocked)
  if (seller.status !== 'approved') redirect('/seller/pending');

  const [{ count: productCount }, { count: pendingOrderCount }, { data: recentOrders }] =
    await Promise.all([
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', seller.id),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', seller.id)
        .eq('status', 'pending_payment'),
      supabase
        .from('orders')
        .select('id, order_number, total_krw, status, created_at, payment_method')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total_krw')
    .eq('seller_id', seller.id)
    .in('status', ['paid', 'preparing', 'shipping', 'delivered'])
    .gte('created_at', since.toISOString());

  const weeklyRevenue = (paidOrders ?? []).reduce((sum, o) => sum + Number(o.total_krw), 0);

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">{seller.business_name}</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="7일 매출" value={formatKRW(weeklyRevenue)} />
        <StatCard label="등록 상품" value={String(productCount ?? 0)} />
        <StatCard label="결제 대기 주문" value={String(pendingOrderCount ?? 0)} />
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">최근 주문</h2>
          <Link href="/seller/orders" className="link-apple text-sm">
            전체
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          {recentOrders?.map((o) => (
            <li key={o.id} className="flex items-center justify-between p-5">
              <div>
                <Link href={`/seller/orders/${o.id}`} className="font-medium hover:underline">
                  {o.order_number}
                </Link>
                <p className="text-sm text-gray-500">{formatDate(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatKRW(Number(o.total_krw))}</p>
                <p className="text-xs text-gray-500">{o.status}</p>
              </div>
            </li>
          ))}
          {(!recentOrders || recentOrders.length === 0) && (
            <li className="p-8 text-center text-gray-500">아직 주문이 없습니다.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
