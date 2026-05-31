import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatKRW, formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: '결제 대기',
  paid: '결제 완료',
  preparing: '배송 준비',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
  refunded: '환불',
};

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single();
  if (!seller) redirect('/');

  const status = searchParams.status ?? 'all';
  let q = supabase
    .from('orders')
    .select('*, profiles!orders_customer_id_fkey(name, email)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });

  if (status !== 'all') q = q.eq('status', status);

  const { data: orders } = await q;

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">주문 관리</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'pending_payment', 'paid', 'preparing', 'shipping', 'delivered'].map((s) => (
          <Link
            key={s}
            href={`/seller/orders?status=${s}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              status === s
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            {s === 'all' ? '전체' : STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">주문번호</th>
              <th className="px-6 py-3">고객</th>
              <th className="px-6 py-3 text-right">금액</th>
              <th className="px-6 py-3">결제수단</th>
              <th className="px-6 py-3 text-center">상태</th>
              <th className="px-6 py-3">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders?.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/seller/orders/${o.id}`} className="font-medium hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {o.profiles?.name ?? o.profiles?.email ?? '—'}
                </td>
                <td className="px-6 py-4 text-right">{formatKRW(Number(o.total_krw))}</td>
                <td className="px-6 py-4 text-gray-600">
                  {o.payment_method === 'usdt' ? 'USDT' : '계좌이체'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDate(o.created_at)}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
