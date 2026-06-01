'use client';

import { useState, useTransition } from 'react';
import { submitTxid } from '@/app/actions/orders';

export default function TxidSubmitForm({
  orderId,
  existing,
}: {
  orderId: string;
  existing?: { tx_hash: string; chain: string; status: string } | null;
}) {
  const [chain, setChain] = useState<'TRC20' | 'ERC20' | 'BSC'>('TRC20');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  if (existing) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-medium text-green-900">TXID가 제출되었습니다</p>
        <p className="mt-1 font-mono text-xs text-green-800 break-all">{existing.tx_hash}</p>
        <p className="mt-2 text-xs text-green-700">
          체인 {existing.chain} · 상태 {existing.status}
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitTxid({ orderId, chain, txHash: txHash.trim() });
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        TXID가 정상적으로 등록되었습니다. 공급자의 확인을 기다려 주세요.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">체인</label>
        <div className="mt-2 flex gap-2 flex-wrap">
          {(['TRC20', 'ERC20', 'BSC'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChain(c)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                chain === c
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="txhash">
          TXID (트랜잭션 해시)
        </label>
        <input
          id="txhash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder={
            chain === 'TRC20'
              ? '64자리 16진수'
              : '0x로 시작하는 66자 (EVM)'
          }
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm focus:border-black focus:outline-none"
          required
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || txHash.trim().length === 0}
        className="btn-apple w-full disabled:opacity-50"
      >
        {pending ? '제출 중…' : 'TXID 제출'}
      </button>
    </form>
  );
}
