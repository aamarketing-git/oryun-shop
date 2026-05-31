import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKRW, formatUSDT, formatDate } from '@/lib/utils';
import { CopyText } from '@/components/ui/CopyText';
import TxidSubmitForm from '@/components/order/TxidSubmitForm';

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: '결제 대기', color: '#B45309', bg: '#FEF3C7' },
  paid:            { label: '결제 완료', color: '#047857', bg: '#D1FAE5' },
  preparing:       { label: '배송 준비', color: '#1E40AF', bg: '#DBEAFE' },
  shipping:        { label: '배송 중',   color: '#3730A3', bg: '#E0E7FF' },
  delivered:       { label: '배송 완료', color: '#374151', bg: '#F3F4F6' },
  cancelled:       { label: '취소',     color: '#B91C1C', bg: '#FEE2E2' },
  refunded:        { label: '환불',     color: '#374151', bg: '#F3F4F6' },
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/account/orders/${params.id}`);

  // ⚠️ 모든 컬럼명을 DB와 정확히 일치시킴
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, products(id, name, main_image_url)),
      sellers(
        business_name,
        representative_name,
        contact_phone,
        bank_name,
        bank_account_number,
        bank_account_holder,
        usdt_wallet_trc20,
        usdt_wallet_erc20,
        usdt_wallet_bsc
      ),
      txid_records(*),
      shipments(*)
    `)
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (!order) notFound();

  const totalUsdt = Number(order.total_krw) / Number(order.usdt_rate || 1500);
  const cleanAccount = (order.sellers?.bank_account_number ?? '').replace(/\D/g, '');
  const statusInfo = STATUS_INFO[order.status] ?? STATUS_INFO.pending_payment;

  // USDT 받을 주소
  const usdtWallets = [
    { chain: 'TRC20 (Tron)', addr: order.sellers?.usdt_wallet_trc20 },
    { chain: 'ERC20 (Ethereum)', addr: order.sellers?.usdt_wallet_erc20 },
    { chain: 'BSC / BEP-20', addr: order.sellers?.usdt_wallet_bsc },
  ].filter((w) => w.addr && String(w.addr).trim().length > 0);

  return (
    <main className="apple-container py-12">
      <Link href="/account/orders" className="text-sm text-gray-500 hover:text-gray-900">
        ← 주문 목록
      </Link>

      {/* 헤더 */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">주문번호</p>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        <span
          className="rounded-full px-4 py-1.5 text-sm font-semibold"
          style={{ background: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* 결제 대기 시 — 입금 안내 */}
      {order.status === 'pending_payment' && (
        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900 mb-1">⏰ 입금 대기 중</h2>
          <p className="text-sm text-amber-800 mb-4">
            24시간 이내에 아래 정보로 입금해주세요. 입금 후 관리자 확인 후 배송이 진행됩니다.
          </p>

          {order.payment_method === 'bank_transfer' ? (
            <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
              <Row label="은행">
                <span className="font-medium">{order.sellers?.bank_name || '—'}</span>
              </Row>
              <Row label="예금주">
                <span className="font-medium">{order.sellers?.bank_account_holder || '—'}</span>
              </Row>
              <Row label="계좌번호">
                {cleanAccount ? (
                  <CopyText value={cleanAccount} display={order.sellers!.bank_account_number!} mono label="계좌번호" />
                ) : <span className="text-gray-400">—</span>}
              </Row>
              <Row label="입금 금액">
                <CopyText
                  value={String(order.total_krw)}
                  display={formatKRW(Number(order.total_krw))}
                  label="입금 금액"
                />
              </Row>
              <p className="mt-2 text-xs text-gray-500">
                💡 계좌번호와 금액을 클릭하면 바로 복사됩니다.
              </p>
            </div>
          ) : (
            // USDT
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                <Row label="송금 금액">
                  <CopyText value={totalUsdt.toFixed(2)} display={formatUSDT(totalUsdt)} label="USDT 금액" />
                </Row>
                <Row label="환율">
                  <span className="text-sm">1 USDT = {formatKRW(Number(order.usdt_rate))}</span>
                </Row>
              </div>
              {usdtWallets.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-3">
                  <p className="text-sm font-semibold">공급자 USDT 받는 주소</p>
                  {usdtWallets.map((w) => (
                    <div key={w.chain}>
                      <p className="text-xs text-gray-500 mb-1">{w.chain}</p>
                      <CopyText value={w.addr!} display={w.addr!} mono label={`${w.chain} 주소`} />
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <p className="text-sm font-semibold mb-3">TXID 제출</p>
                <p className="text-xs text-gray-500 mb-3">
                  송금이 완료되면 트랜잭션 해시를 입력해주세요.
                </p>
                <TxidSubmitForm orderId={order.id} existing={order.txid_records?.[0]} />
              </div>
            </div>
          )}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* 좌측 (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* 주문 상품 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold mb-4">📦 주문 상품</h2>
            <ul className="divide-y divide-gray-100">
              {order.order_items?.map((item: any) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  {item.products?.main_image_url && (
                    <img
                      src={item.products.main_image_url}
                      alt={item.product_name}
                      className="h-14 w-14 rounded-lg bg-gray-50 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatKRW(Number(item.unit_price_krw))} × {item.quantity}개
                    </p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatKRW(Number(item.subtotal_krw))}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-bold">
              <span>총 금액</span>
              <span>{formatKRW(Number(order.total_krw))}</span>
            </div>
          </section>

          {/* 배송 정보 */}
          {order.shipments && order.shipments.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold mb-4">🚚 배송 정보</h2>
              {order.shipments.map((s: any) => (
                <dl key={s.id} className="space-y-2 text-sm">
                  <Row label="배송 방식">
                    <span>{s.method === 'direct' ? '직접 전달' : '택배'}</span>
                  </Row>
                  {s.method !== 'direct' && (
                    <>
                      <Row label="택배사">
                        <span>{s.courier_company ?? '—'}</span>
                      </Row>
                      <Row label="송장번호">
                        {s.tracking_number ? (
                          <CopyText value={s.tracking_number} display={s.tracking_number} mono label="송장번호" />
                        ) : <span>—</span>}
                      </Row>
                    </>
                  )}
                  {s.direct_note && (
                    <Row label="메모"><span>{s.direct_note}</span></Row>
                  )}
                </dl>
              ))}
            </section>
          )}
        </div>

        {/* 우측 사이드 */}
        <aside className="space-y-4">
          {/* 결제 요약 */}
          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold mb-3">결제 정보</h3>
            <dl className="space-y-2 text-sm">
              <Row label="결제 방법">
                <span>{order.payment_method === 'bank_transfer' ? '계좌이체' : 'USDT'}</span>
              </Row>
              <Row label="결제 금액">
                <span className="font-semibold">{formatKRW(Number(order.total_krw))}</span>
              </Row>
              {order.payment_method === 'usdt' && (
                <>
                  <Row label="USDT">
                    <span>{formatUSDT(totalUsdt)}</span>
                  </Row>
                  <Row label="환율">
                    <span className="text-xs">1 USDT = {formatKRW(Number(order.usdt_rate))}</span>
                  </Row>
                </>
              )}
            </dl>
          </div>

          {/* Staking Wallet (USDT만) */}
          {order.payment_method === 'usdt' && order.staking_wallet_address && order.staking_wallet_address !== '-' && (
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="font-semibold mb-2">오륜 스테이킹 Wallet</h3>
              <p className="break-all font-mono text-xs text-gray-600">
                {order.staking_wallet_address}
              </p>
            </div>
          )}

          {/* 공급자 정보 */}
          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold mb-2">공급자</h3>
            <p className="text-sm font-medium">{order.sellers?.business_name}</p>
            {order.sellers?.contact_phone && (
              <p className="mt-1 text-xs text-gray-500">전화 {order.sellers.contact_phone}</p>
            )}
          </div>

          {/* 배송지 */}
          <div className="rounded-2xl bg-gray-50 p-5">
            <h3 className="font-semibold mb-2">배송지</h3>
            <p className="text-sm">{order.shipping_recipient ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{order.shipping_phone ?? '—'}</p>
            <p className="text-xs text-gray-600 mt-2">
              {[order.shipping_postal_code, order.shipping_address, order.shipping_address_detail]
                .filter(Boolean)
                .join(' ') || '—'}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 text-sm">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
