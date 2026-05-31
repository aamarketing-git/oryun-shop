import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKRW, formatUSDT, formatDate } from '@/lib/utils';
import ConfirmPaymentButton from '@/components/seller/ConfirmPaymentButton';
import ShipmentForm from '@/components/seller/ShipmentForm';

export default async function SellerOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single();
  if (!seller) redirect('/');

  const { data: order } = await supabase
    .from('orders')
    .select(
      `*,
       order_items(*, products(name, main_image_url)),
       profiles!orders_customer_id_fkey(name, email),
       txid_records(*),
       shipments(*)`,
    )
    .eq('id', params.id)
    .eq('seller_id', seller.id)
    .maybeSingle();

  if (!order) notFound();

  const totalUsdt = Number(order.total_krw) / Number(order.usdt_rate || 1500);

  return (
    <div>
      <Link href="/seller/orders" className="link-apple text-sm">
        ← 주문 목록
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">주문번호</p>
          <h1 className="text-3xl font-semibold">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        {(() => {
          const STATUS_LABEL: Record<string, string> = {
            pending_payment: '결제 대기',
            paid: '결제 완료',
            preparing: '배송 준비',
            shipping: '배송 중',
            delivered: '배송 완료',
            cancelled: '취소',
            refunded: '환불',
          };
          const STATUS_BG: Record<string, string> = {
            pending_payment: 'bg-amber-100 text-amber-800',
            paid: 'bg-green-100 text-green-800',
            preparing: 'bg-blue-100 text-blue-800',
            shipping: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700',
          };
          return (
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${STATUS_BG[order.status] ?? 'bg-gray-100'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          );
        })()}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 결제 정보 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">결제</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <dt className="text-gray-500">결제수단</dt>
              <dd>{order.payment_method === 'usdt' ? 'USDT' : '계좌이체'}</dd>

              <dt className="text-gray-500">금액 (KRW)</dt>
              <dd className="font-medium">{formatKRW(Number(order.total_krw))}</dd>

              {order.payment_method === 'usdt' && (
                <>
                  <dt className="text-gray-500">금액 (USDT)</dt>
                  <dd>{formatUSDT(totalUsdt)}</dd>
                  <dt className="text-gray-500">환율</dt>
                  <dd>1 USDT = {formatKRW(Number(order.usdt_rate))}</dd>
                </>
              )}
            </dl>

            {order.txid_records && order.txid_records.length > 0 && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">제출된 TXID</p>
                {order.txid_records.map((t: any) => (
                  <div key={t.id} className="mt-2">
                    <p className="break-all font-mono text-xs">{t.tx_hash}</p>
                    <p className="text-xs text-gray-500">체인 {t.chain} · 상태 {t.status}</p>
                  </div>
                ))}
              </div>
            )}

            {order.status === 'pending_payment' && (
              <div className="mt-4">
                <ConfirmPaymentButton orderId={order.id} />
              </div>
            )}
          </section>

          {/* 배송 */}
          {['paid', 'preparing'].includes(order.status) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold">배송 등록</h2>
              <div className="mt-4">
                <ShipmentForm
                  orderId={order.id}
                  shipping={{
                    recipient: order.shipping_recipient,
                    phone: order.shipping_phone,
                    postal_code: order.shipping_postal_code,
                    address: order.shipping_address,
                    address_detail: order.shipping_address_detail,
                  }}
                />
              </div>
            </section>
          )}

          {order.shipments && order.shipments.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold">배송 정보</h2>
              {order.shipments.map((s: any) => (
                <div key={s.id} className="mt-3 space-y-1 text-sm">
                  <p>방식: {s.method === 'courier' ? '택배' : '직접 전달'}</p>
                  {s.carrier && <p>택배사: {s.carrier}</p>}
                  {s.tracking_number && <p className="font-mono">송장: {s.tracking_number}</p>}
                  {s.note && <p>메모: {s.note}</p>}
                </div>
              ))}
            </section>
          )}

          {/* 주문 상품 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">상품</h2>
            <ul className="mt-3 divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  {item.products?.main_image_url && (
                    <img
                      src={item.products.main_image_url}
                      alt=""
                      className="h-12 w-12 rounded-lg bg-gray-50 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatKRW(Number(item.unit_price_krw))} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatKRW(Number(item.unit_price_krw) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold">고객</h3>
            <p className="mt-2 text-sm">{order.profiles?.name ?? '—'}</p>
            <p className="text-xs text-gray-500">{order.profiles?.email}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold">Staking Wallet</h3>
            <p className="mt-2 break-all font-mono text-xs text-gray-600">
              {order.staking_wallet_address}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold">배송지</h3>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {order.shipping_address || '—'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
