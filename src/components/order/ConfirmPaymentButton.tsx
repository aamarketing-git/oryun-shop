'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { confirmPayment } from '@/app/actions/orders';

/**
 * 결제 완료 처리 버튼. 관리자/공급자 양쪽에서 사용.
 * 입금 확인 후 status가 'pending_payment' → 'paid'로 변경.
 * 이후 공급자가 배송 등록 가능.
 */
export default function ConfirmPaymentButton({
  orderId,
  label = "결제완료 처리",
  size = "md",
}: {
  orderId: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onClick = () => {
    if (!confirm("입금을 확인하셨습니까?\n확인 시 주문이 '결제완료' 상태가 되어 공급자가 배송을 진행할 수 있습니다.")) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmPayment(orderId);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  if (done) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-semibold">
        ✓ 결제완료 처리됨
      </div>
    );
  }

  const sizeClass = size === "sm"
    ? "px-3 py-1.5 text-xs"
    : "px-5 py-2.5 text-sm";

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className={`rounded-[14px] bg-[#3182F6] text-white font-semibold disabled:opacity-50 hover:bg-[#1B64DA] transition ${sizeClass}`}
      >
        {pending ? '처리 중...' : `✓ ${label}`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
