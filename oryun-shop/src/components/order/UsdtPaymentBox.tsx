'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatKRW, formatUSDT } from '@/lib/utils';

export default function UsdtPaymentBox({
  amountUsdt,
  usdtRate,
  amountKrw,
  receiveAddressTrc20,
  receiveAddressErc20,
}: {
  amountUsdt: number;
  usdtRate: number;
  amountKrw: number;
  receiveAddressTrc20: string;
  receiveAddressErc20: string;
}) {
  const [chain, setChain] = useState<'TRC20' | 'ERC20'>('TRC20');
  const [copied, setCopied] = useState(false);

  const address = chain === 'TRC20' ? receiveAddressTrc20 : receiveAddressErc20;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-2">
      <div>
        <p className="section-eyebrow">송금 정보</p>
        <p className="mt-2 text-3xl font-semibold">{formatUSDT(amountUsdt)}</p>
        <p className="mt-1 text-sm text-gray-500">
          {formatKRW(amountKrw)} · 1 USDT = {formatKRW(usdtRate)}
        </p>

        <div className="mt-6 flex gap-2">
          {(['TRC20', 'ERC20'] as const).map((c) => (
            <button
              key={c}
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

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">송금 주소 ({chain})</p>
          <p className="mt-2 break-all font-mono text-sm">{address || '주소 미설정'}</p>
          <button
            onClick={copy}
            disabled={!address}
            className="mt-3 rounded-full bg-white border border-gray-300 px-4 py-1.5 text-xs font-medium hover:border-black disabled:opacity-50"
          >
            {copied ? '복사됨' : '주소 복사'}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          ⚠️ 반드시 <strong>{chain}</strong> 네트워크로 송금하세요. 다른 네트워크로 송금 시 자산이 영구 손실됩니다.
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-6">
        {address ? (
          <>
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={address} size={192} />
            </div>
            <p className="mt-4 text-xs text-gray-500">{chain} 송금 QR</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">관리자가 송금 주소를 설정해야 합니다.</p>
        )}
      </div>
    </div>
  );
}
