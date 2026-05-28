'use client';

import { useState, useTransition } from 'react';
import { registerShipment } from '@/app/actions/orders';

export default function ShipmentForm({ orderId }: { orderId: string }) {
  const [method, setMethod] = useState<'courier' | 'direct'>('courier');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      {method === 'courier' ? (
        <>
          <div>
            <label className="text-sm font-medium">택배사</label>
            <input
              required
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="예: CJ대한통운"
              className={input}
            />
          </div>
          <div>
            <label className="text-sm font-medium">송장번호</label>
            <input
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
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

      <button type="submit" disabled={pending} className="btn-apple">
        {pending ? '등록 중…' : '배송 등록'}
      </button>
    </form>
  );
}
