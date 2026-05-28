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

export default async function OrdersListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/account/orders');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total_krw, status, created_at, payment_method')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <main className="apple-container py-12">
      <p className="section-eyebrow">Orders</p>
      <h1 className="mt-2 text-4xl font-semibold">주문 내역</h1>

      {!orders || orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          주문 내역이 없습니다.
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex items-center justify-between gap-4 p-6 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{o.order_number}</p>
                  <p className="text-sm text-gray-500">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatKRW(Number(o.total_krw))}</p>
                  <p className="text-xs text-gray-500">
                    {STATUS_LABEL[o.status] ?? o.status} ·{' '}
                    {o.payment_method === 'usdt' ? 'USDT' : '계좌이체'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
