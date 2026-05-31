'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { approveProduct, rejectProduct, hideProduct } from '@/app/actions/products';

export default function ProductActions({
  productId,
  status,
  hasDetail,
}: {
  productId: string;
  status: string;
  hasDetail: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveProduct(productId);
      if (res?.error) setError(res.error);
    });
  };

  const onReject = () => {
    const reason = prompt('거절 사유');
    if (!reason) return;
    startTransition(async () => {
      const res = await rejectProduct(productId, reason);
      if (res?.error) setError(res.error);
    });
  };

  const onHide = () => {
    if (!confirm('이 상품을 비공개 처리하시겠습니까?')) return;
    startTransition(async () => {
      const res = await hideProduct(productId);
      if (res?.error) setError(res.error);
    });
  };

  return (
    <div className="flex justify-end gap-2 text-xs">
      <Link href={`/admin/products/${productId}/detail`} className="link-apple">
        상세
      </Link>

      {status === 'pending' && hasDetail && (
        <button onClick={onApprove} disabled={pending} className="text-green-700 hover:underline">
          승인
        </button>
      )}
      {status === 'pending' && (
        <button onClick={onReject} disabled={pending} className="text-red-700 hover:underline">
          거절
        </button>
      )}
      {status === 'approved' && (
        <button onClick={onHide} disabled={pending} className="text-gray-700 hover:underline">
          비공개
        </button>
      )}

      {error && <span className="ml-2 text-red-600">{error}</span>}
    </div>
  );
}
