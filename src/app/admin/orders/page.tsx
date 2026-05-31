import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatKRW, formatDate } from '@/lib/utils';
import ConfirmPaymentButton from '@/components/order/ConfirmPaymentButton';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: '결제 대기',
  paid: '결제 완료',
  preparing: '배송 준비',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
  refunded: '환불',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createServiceClient();
  const status = searchParams.status ?? 'all';

  let q = supabase
    .from('orders')
    .select('*, sellers(business_name), profiles!orders_customer_id_fkey(email)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') q = q.eq('status', status);
  const { data: orders } = await q;

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">주문 관리</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'pending_payment', 'paid', 'shipping', 'delivered', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              status === s ? 'border-black bg-black text-white' : 'border-gray-300 bg-white'
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
              <th className="px-6 py-3">공급자</th>
              <th className="px-6 py-3">고객</th>
              <th className="px-6 py-3 text-right">금액</th>
              <th className="px-6 py-3">결제</th>
              <th className="px-6 py-3 text-center">상태</th>
              <th className="px-6 py-3">일시</th>
              <th className="px-6 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders?.map((o: any) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{o.order_number}</td>
                <td className="px-6 py-3 text-gray-600">{o.sellers?.business_name}</td>
                <td className="px-6 py-3 text-gray-600">{o.profiles?.email}</td>
                <td className="px-6 py-3 text-right">{formatKRW(Number(o.total_krw))}</td>
                <td className="px-6 py-3 text-gray-600">
                  {o.payment_method === 'usdt' ? 'USDT' : '계좌이체'}
                </td>
                <td className="px-6 py-3 text-center">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                <td className="px-6 py-3 text-center">
                  {o.status === 'pending_payment' ? (
                    <ConfirmPaymentButton orderId={o.id} label="결제완료" size="sm" />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
