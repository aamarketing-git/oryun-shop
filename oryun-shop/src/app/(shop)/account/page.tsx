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

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/account');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total_krw, status, created_at, payment_method')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="apple-container py-12">
      <p className="section-eyebrow">My Account</p>
      <h1 className="mt-2 text-4xl font-semibold">{profile?.full_name || user.email}</h1>
      <p className="mt-1 text-gray-500">{user.email}</p>

      {profile?.staking_wallet_address && (
        <div className="mt-6 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-xs">
          Staking Wallet ·{' '}
          <span className="font-mono">{profile.staking_wallet_address.slice(0, 12)}…</span>
        </div>
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">최근 주문</h2>
          <Link href="/account/orders" className="link-apple text-sm">
            전체 보기
          </Link>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            아직 주문 내역이 없습니다.
            <div className="mt-4">
              <Link href="/products" className="btn-apple">
                쇼핑 시작하기
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
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
      </section>
    </main>
  );
}
