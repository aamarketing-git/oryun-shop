'use client';

import { useState, useTransition } from 'react';
import { confirmPayment } from '@/app/actions/orders';

export default function ConfirmPaymentButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    if (!confirm('입금을 확인하고 결제완료로 처리하시겠습니까?')) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmPayment(orderId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div>
      <button onClick={onClick} disabled={pending} className="btn-apple">
        {pending ? '처리 중…' : '결제 확인 (Paid 처리)'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
