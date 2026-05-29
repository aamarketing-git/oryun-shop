import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKRW, formatUSDT, formatDate } from '@/lib/utils';
import TxidSubmitForm from '@/components/order/TxidSubmitForm';
import UsdtPaymentBox from '@/components/order/UsdtPaymentBox';
import BankTransferBox from '@/components/order/BankTransferBox';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: '결제 대기',
  paid: '결제 완료',
  preparing: '배송 준비',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소',
  refunded: '환불',
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/account/orders/${params.id}`);

  const { data: order } = await supabase
    .from('orders')
    .select(
      `*,
       order_items(*, products(id, name, main_image_url)),
       sellers(business_name, bank_name, bank_account, bank_holder, usdt_address_trc20, usdt_address_erc20, contact_phone, contact_kakao, contact_telegram),
       txid_records(*),
       shipments(*)`,
    )
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (!order) notFound();

  const totalUsdt = Number(order.total_krw) / Number(order.usdt_rate || 1500);

  return (
    <main className="apple-container py-12">
      <Link href="/account/orders" className="link-apple text-sm">
        ← 주문 목록
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">주문번호</p>
          <h1 className="text-3xl font-semibold">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* 좌측: 결제 정보 (2/3) */}
        <div className="space-y-8 lg:col-span-2">
          {/* 결제 안내 */}
          {order.status === 'pending_payment' && (
            <section className="rounded-2xl border border-gray-200 bg-white p-8">
              <h2 className="text-xl font-semibold">결제 진행</h2>

              {order.payment_method === 'bank_transfer' ? (
                <BankTransferBox
                  bankName={order.sellers?.bank_name ?? ''}
                  bankAccount={order.sellers?.bank_account ?? ''}
                  bankHolder={order.sellers?.bank_holder ?? ''}
                  amount={Number(order.total_krw)}
                />
              ) : (
                <>
                  <UsdtPaymentBox
                    amountUsdt={totalUsdt}
                    usdtRate={Number(order.usdt_rate)}
                    amountKrw={Number(order.total_krw)}
                    receiveAddressTrc20={process.env.USDT_RECEIVE_ADDRESS_TRC20 || ''}
                    receiveAddressErc20={process.env.USDT_RECEIVE_ADDRESS_ERC20 || ''}
                    receiveAddressBsc={process.env.USDT_RECEIVE_ADDRESS_BSC || ''}
                  />
                  <div className="mt-8 border-t border-gray-100 pt-8">
                    <h3 className="font-semibold">TXID 제출</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      송금 완료 후 트랜잭션 해시를 입력하세요. 한 번 사용된 TXID는 재사용할 수 없습니다.
                    </p>
                    <div className="mt-4">
                      <TxidSubmitForm
                        orderId={order.id}
                        existing={order.txid_records?.[0]}
                      />
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* 배송 정보 */}
          {order.shipments && order.shipments.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-8">
              <h2 className="text-xl font-semibold">배송</h2>
              {order.shipments.map((s: any) => (
                <div key={s.id} className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">방식</span>{' '}
                    {s.method === 'courier' ? '택배' : '직접 전달'}
                  </p>
                  {s.carrier && (
                    <p>
                      <span className="text-gray-500">택배사</span> {s.carrier}
                    </p>
                  )}
                  {s.tracking_number && (
                    <p>
                      <span className="text-gray-500">송장번호</span>{' '}
                      <span className="font-mono">{s.tracking_number}</span>
                    </p>
                  )}
                  {s.note && (
                    <p>
                      <span className="text-gray-500">메모</span> {s.note}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* 주문 상품 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8">
            <h2 className="text-xl font-semibold">주문 상품</h2>
            <ul className="mt-4 divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <li key={item.id} className="flex items-center gap-4 py-4">
                  {item.products?.main_image_url && (
                    <img
                      src={item.products.main_image_url}
                      alt={item.product_name}
                      className="h-16 w-16 rounded-lg bg-gray-50 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {formatKRW(Number(item.unit_price_krw))} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatKRW(Number(item.unit_price_krw) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 우측: 요약 */}
        <aside className="space-y-6">
          <div className="rounded-2xl bg-gray-50 p-6">
            <h3 className="font-semibold">결제 요약</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">결제수단</dt>
                <dd>{order.payment_method === 'bank_transfer' ? '계좌이체' : 'USDT'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">결제 금액</dt>
                <dd className="font-semibold">{formatKRW(Number(order.total_krw))}</dd>
              </div>
              {order.payment_method === 'usdt' && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">USDT 금액</dt>
                    <dd>{formatUSDT(totalUsdt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">적용 환율</dt>
                    <dd>1 USDT = {formatKRW(Number(order.usdt_rate))}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <h3 className="font-semibold">오륜 스테이킹 Wallet</h3>
            <p className="mt-2 break-all font-mono text-xs text-gray-600">
              {order.staking_wallet_address}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-6">
            <h3 className="font-semibold">공급자</h3>
            <p className="mt-2 text-sm">{order.sellers?.business_name}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              {order.sellers?.contact_phone && <p>전화 {order.sellers.contact_phone}</p>}
              {order.sellers?.contact_kakao && <p>카카오 {order.sellers.contact_kakao}</p>}
              {order.sellers?.contact_telegram && <p>텔레그램 {order.sellers.contact_telegram}</p>}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
