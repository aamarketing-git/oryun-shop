import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatKRW, formatUSDT, formatDate } from '@/lib/utils';
import ConfirmPaymentButton from '@/components/order/ConfirmPaymentButton';

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: '결제 대기', color: '#B45309', bg: '#FEF3C7' },
  paid: { label: '결제 완료', color: '#047857', bg: '#D1FAE5' },
  preparing: { label: '배송 준비', color: '#1E40AF', bg: '#DBEAFE' },
  shipping: { label: '배송 중', color: '#3730A3', bg: '#E0E7FF' },
  delivered: { label: '배송 완료', color: '#374151', bg: '#F3F4F6' },
  cancelled: { label: '취소', color: '#B91C1C', bg: '#FEE2E2' },
  refunded: { label: '환불', color: '#374151', bg: '#F3F4F6' },
};

// 흐름의 각 단계
const STEPS = [
  { key: 'pending_payment', label: '주문 접수', icon: '📝' },
  { key: 'paid',            label: '결제 완료', icon: '💳' },
  { key: 'preparing',       label: '배송 준비', icon: '📦' },
  { key: 'shipping',        label: '배송 중',   icon: '🚚' },
  { key: 'delivered',       label: '배송 완료', icon: '✅' },
];

// 현재 상태가 각 단계를 통과했는지
function getStepStatus(currentStatus: string, stepIndex: number): 'done' | 'current' | 'pending' {
  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return stepIndex === 0 ? 'done' : 'pending';
  }
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);
  if (currentIndex < 0) return 'pending';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, products(id, name, main_image_url)),
      sellers(id, business_name, representative_name, contact_phone, bank_name, bank_account_number, bank_account_holder),
      profiles!orders_customer_id_fkey(name, email, phone),
      txid_records(*),
      shipments(*)
    `)
    .eq('id', params.id)
    .maybeSingle();

  if (!order) notFound();

  const totalUsdt = Number(order.total_krw) / Number(order.usdt_rate || 1500);
  const statusInfo = STATUS_INFO[order.status] ?? STATUS_INFO.pending_payment;
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  // 배송지는 orders 테이블의 개별 컬럼 (shipping_recipient, shipping_phone 등)
  const shipping = {
    recipient: order.shipping_recipient,
    phone: order.shipping_phone,
    postal_code: order.shipping_postal_code,
    address: order.shipping_address,
    address_detail: order.shipping_address_detail,
  };

  return (
    <div className="max-w-5xl">
      {/* 상단 네비 */}
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900">
        ← 주문 목록
      </Link>

      {/* 헤더 */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">주문번호</p>
          <h1 className="text-3xl font-semibold mt-1">{order.order_number}</h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
        <span
          className="rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: statusInfo.bg, color: statusInfo.color }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* 진행 타임라인 */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-6">진행 상황</h2>
        {isCancelled ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-center">
            ⚠️ 이 주문은 {statusInfo.label}되었습니다.
          </div>
        ) : (
          <div className="relative">
            {/* 가로 진행바 (데스크탑) */}
            <div className="hidden md:flex items-start justify-between relative">
              {/* 배경 선 */}
              <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" />
              {/* 진행된 선 */}
              <div
                className="absolute top-6 left-0 h-0.5 bg-[#3182F6] transition-all"
                style={{
                  width: `${
                    (STEPS.findIndex((s) => s.key === order.status) /
                      (STEPS.length - 1)) *
                    100
                  }%`,
                }}
              />
              {STEPS.map((step, i) => {
                const state = getStepStatus(order.status, i);
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center w-1/5">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                        state === 'done'
                          ? 'bg-[#3182F6] border-[#3182F6] text-white'
                          : state === 'current'
                          ? 'bg-white border-[#3182F6] text-[#3182F6] ring-4 ring-blue-100'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {state === 'done' ? '✓' : step.icon}
                    </div>
                    <p
                      className={`mt-3 text-xs font-medium text-center ${
                        state === 'current'
                          ? 'text-[#3182F6] font-bold'
                          : state === 'done'
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 세로 진행바 (모바일) */}
            <div className="md:hidden space-y-3">
              {STEPS.map((step, i) => {
                const state = getStepStatus(order.status, i);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        state === 'done'
                          ? 'bg-[#3182F6] text-white'
                          : state === 'current'
                          ? 'bg-blue-100 text-[#3182F6] ring-2 ring-[#3182F6]'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {state === 'done' ? '✓' : step.icon}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        state === 'current'
                          ? 'text-[#3182F6] font-bold'
                          : state === 'done'
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 결제 대기일 때 관리자 액션 */}
        {order.status === 'pending_payment' && (
          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-900 mb-2">⏰ 입금 확인 필요</p>
            <p className="text-xs text-amber-800 mb-3">
              고객이 입금한 것을 확인하면 아래 버튼을 눌러 결제 완료 처리해주세요.
              그러면 공급자가 배송을 시작할 수 있습니다.
            </p>
            <ConfirmPaymentButton orderId={order.id} label="결제완료 처리" />
          </div>
        )}
      </section>

      {/* 2열 정보 그리드 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 주문 상품 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">📦 주문 상품</h2>
          <ul className="divide-y divide-gray-100">
            {order.order_items?.map((item: any) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                {item.products?.main_image_url && (
                  <img
                    src={item.products.main_image_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover bg-gray-50"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    수량 {item.quantity}개 · {formatKRW(Number(item.unit_price_krw))}
                  </p>
                </div>
                <p className="font-semibold">{formatKRW(Number(item.subtotal_krw))}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
            <span>총 금액</span>
            <span>{formatKRW(Number(order.total_krw))}</span>
          </div>
        </section>

        {/* 고객 정보 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">👤 고객 정보</h2>
          <dl className="space-y-2 text-sm">
            <Row label="이름" value={order.profiles?.name ?? '—'} />
            <Row label="이메일" value={order.profiles?.email ?? '—'} />
            <Row label="전화번호" value={order.profiles?.phone ?? '—'} />
            <Row label="수령인" value={shipping?.recipient ?? '—'} />
            <Row label="수령인 전화" value={shipping?.phone ?? '—'} />
            <Row label="주소" value={
              shipping?.postal_code || shipping?.address
                ? `${shipping?.postal_code ?? ''} ${shipping?.address ?? ''} ${shipping?.address_detail ?? ''}`.trim()
                : '—'
            } />
            <Row
              label="Staking Wallet"
              value={order.staking_wallet_address ?? '—'}
              mono
            />
          </dl>
        </section>

        {/* 공급자 정보 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">🏪 공급자 정보</h2>
          <dl className="space-y-2 text-sm">
            <Row label="상호명" value={order.sellers?.business_name ?? '—'} />
            <Row label="대표자명" value={order.sellers?.representative_name ?? '—'} />
            <Row label="연락처" value={order.sellers?.contact_phone ?? '—'} />
            <Row label="입금 은행" value={order.sellers?.bank_name ?? '—'} />
            <Row
              label="계좌번호"
              value={order.sellers?.bank_account_number ?? '—'}
              mono
            />
            <Row label="예금주" value={order.sellers?.bank_account_holder ?? '—'} />
          </dl>
        </section>

        {/* 결제 정보 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">💳 결제 정보</h2>
          <dl className="space-y-2 text-sm">
            <Row
              label="결제 방법"
              value={order.payment_method === 'usdt' ? 'USDT' : '계좌이체'}
            />
            <Row label="금액 (KRW)" value={formatKRW(Number(order.total_krw))} />
            {order.payment_method === 'usdt' && (
              <>
                <Row label="금액 (USDT)" value={formatUSDT(totalUsdt)} />
                <Row
                  label="환율"
                  value={`1 USDT = ${formatKRW(Number(order.usdt_rate))}`}
                />
              </>
            )}
          </dl>

          {/* TXID 정보 */}
          {order.txid_records && order.txid_records.length > 0 && (
            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">제출된 TXID</p>
              {order.txid_records.map((t: any) => (
                <div key={t.id} className="text-xs">
                  <p className="font-mono break-all text-gray-700">{t.tx_hash}</p>
                  <p className="text-gray-500 mt-0.5">
                    체인 {t.chain} · 상태 <strong>{t.status}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 배송 정보 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">🚚 배송 정보</h2>
          {order.shipments && order.shipments.length > 0 ? (
            <dl className="space-y-2 text-sm">
              {order.shipments.map((s: any) => (
                <div key={s.id} className="space-y-2">
                  <Row
                    label="배송 방식"
                    value={s.method === 'direct' ? '직접 전달' : '택배'}
                  />
                  {s.method !== 'direct' && (
                    <>
                      <Row label="택배사" value={s.courier_company ?? '—'} />
                      <Row label="송장번호" value={s.tracking_number ?? '—'} mono />
                    </>
                  )}
                  {s.direct_note && <Row label="메모" value={s.direct_note} />}
                  <Row label="등록일" value={formatDate(s.created_at)} />
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-500">
              아직 배송 정보가 등록되지 않았어요.
              <br />
              공급자가 결제 확인 후 배송을 등록합니다.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 flex-shrink-0">{label}</dt>
      <dd className={`text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
