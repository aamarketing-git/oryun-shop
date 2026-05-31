'use client';

import { useState, useTransition } from 'react';
import { registerShipment } from '@/app/actions/orders';
import { CopyText } from '@/components/ui/CopyText';

// 주요 한국 택배사 (드롭다운 옵션)
const COURIERS = [
  'CJ대한통운',
  '한진택배',
  '롯데택배',
  '우체국택배',
  '로젠택배',
  'GTX로지스',
  '경동택배',
  'CU편의점택배',
  'GS25편의점택배',
  '쿠팡',
  '드림배송',
  '대신택배',
  '일양로지스',
  'KGB택배',
  '천일택배',
  '합동택배',
  '직접 입력',
];

interface ShippingInfo {
  recipient?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  address?: string | null;
  address_detail?: string | null;
}

export default function ShipmentForm({
  orderId,
  shipping,
}: {
  orderId: string;
  shipping?: ShippingInfo;
}) {
  const [method, setMethod] = useState<'courier' | 'direct'>('courier');
  const [carrierSelect, setCarrierSelect] = useState('');
  const [carrierCustom, setCarrierCustom] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const carrier =
    carrierSelect === '직접 입력'
      ? carrierCustom.trim()
      : carrierSelect;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (method === 'courier' && !carrier) {
      setError('택배사를 선택해주세요.');
      return;
    }
    startTransition(async () => {
      const res = await registerShipment({
        orderId,
        method,
        carrier: method === 'courier' ? carrier : undefined,
        trackingNumber: method === 'courier' ? trackingNumber : undefined,
        note: method === 'direct' ? note : undefined,
      });
      if (res?.error) setError(res.error);
    });
  };

  const input =
    'mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';

  // 송장 일괄 복사용 (수령인 | 전화 | 주소)
  const fullAddress =
    [shipping?.postal_code, shipping?.address, shipping?.address_detail]
      .filter(Boolean)
      .join(' ')
      .trim();
  const combinedClipboard =
    [
      shipping?.recipient && `이름: ${shipping.recipient}`,
      shipping?.phone && `전화: ${shipping.phone}`,
      fullAddress && `주소: ${fullAddress}`,
    ]
      .filter(Boolean)
      .join('\n');

  const hasShipping = shipping?.recipient || shipping?.address;

  return (
    <div className="space-y-5">
      {/* 배송 정보 — 클릭 복사 */}
      {hasShipping && (
        <section className="rounded-2xl bg-[#F2F4F6] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">📋 송장 입력용 정보</p>
            <CopyText
              value={combinedClipboard}
              display="✓ 전체 복사"
              label="배송 정보 전체"
              className="!text-xs"
            />
          </div>
          <div className="space-y-2 bg-white rounded-xl p-3 border border-gray-200">
            <Row label="고객명">
              {shipping?.recipient ? (
                <CopyText
                  value={shipping.recipient}
                  display={shipping.recipient}
                  label="고객명"
                />
              ) : <span className="text-gray-400 text-sm">—</span>}
            </Row>
            <Row label="전화번호">
              {shipping?.phone ? (
                <CopyText
                  value={shipping.phone}
                  display={shipping.phone}
                  mono
                  label="전화번호"
                />
              ) : <span className="text-gray-400 text-sm">—</span>}
            </Row>
            <Row label="주소">
              {fullAddress ? (
                <CopyText
                  value={fullAddress}
                  display={fullAddress}
                  label="주소"
                />
              ) : <span className="text-gray-400 text-sm">—</span>}
            </Row>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            💡 각 항목을 클릭하면 자동 복사돼요. 우측 "전체 복사"는 한 번에 모두 복사합니다.
          </p>
        </section>
      )}

      {/* 배송 방식 선택 */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">배송 방식</p>
          <div className="flex gap-2">
            {(['courier', 'direct'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  method === m
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                {m === 'courier' ? '택배' : '직접 전달'}
              </button>
            ))}
          </div>
        </div>

        {method === 'courier' ? (
          <>
            {/* 택배사 드롭다운 */}
            <div>
              <label className="text-sm font-medium">택배사</label>
              <select
                required
                value={carrierSelect}
                onChange={(e) => setCarrierSelect(e.target.value)}
                className={input}
              >
                <option value="">택배사를 선택하세요</option>
                {COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 직접 입력 모드 */}
            {carrierSelect === '직접 입력' && (
              <div>
                <label className="text-sm font-medium">택배사 직접 입력</label>
                <input
                  required
                  value={carrierCustom}
                  onChange={(e) => setCarrierCustom(e.target.value)}
                  placeholder="택배사 이름을 입력하세요"
                  className={input}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">송장번호</label>
              <input
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.replace(/\s/g, ''))}
                placeholder="택배사 송장번호 입력"
                className={input + ' font-mono'}
              />
            </div>
          </>
        ) : (
          <div>
            <label className="text-sm font-medium">직접 전달 메모</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="예: 강남역 1번 출구에서 18시 직접 전달 예정"
              className={input}
            />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[14px] bg-[#3182F6] text-white font-semibold py-3 disabled:opacity-50 hover:bg-[#1B64DA] transition"
        >
          {pending ? '등록 중…' : '배송 등록'}
        </button>
      </form>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500 text-sm flex-shrink-0 pt-1.5">{label}</span>
      <div className="text-right max-w-[70%]">{children}</div>
    </div>
  );
}
