'use client';

import { useState } from 'react';
import { formatKRW } from '@/lib/utils';

export default function BankTransferBox({
  bankName,
  bankAccount,
  bankHolder,
  amount,
}: {
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  amount: number;
}) {
  const [copied, setCopied] = useState<'account' | 'amount' | null>(null);

  const copy = async (value: string, key: 'account' | 'amount') => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="mt-6 rounded-2xl bg-gray-50 p-6">
      <p className="section-eyebrow">입금 정보</p>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-500">은행</dt>
          <dd className="font-medium">{bankName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-500">예금주</dt>
          <dd className="font-medium">{bankHolder}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-gray-500">계좌번호</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono">{bankAccount}</span>
            <button
              onClick={() => copy(bankAccount.replace(/[^0-9]/g, ''), 'account')}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs hover:border-black"
            >
              {copied === 'account' ? '복사됨' : '복사'}
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
          <dt className="text-gray-500">입금 금액</dt>
          <dd className="flex items-center gap-2">
            <span className="text-lg font-semibold">{formatKRW(amount)}</span>
            <button
              onClick={() => copy(String(amount), 'amount')}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs hover:border-black"
            >
              {copied === 'amount' ? '복사됨' : '복사'}
            </button>
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        입금 후 공급자가 직접 확인하여 결제완료 처리합니다. 입금자명은 주문자명과 동일해야 합니다.
      </div>
    </div>
  );
}
