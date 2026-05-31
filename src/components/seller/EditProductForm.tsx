'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSellerProduct } from '@/app/actions/products';
import { formatPhoneKR } from '@/lib/utils';
import { ImagePicker } from '@/components/ui/ImagePicker';

export default function EditProductForm({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    short_description: string | null;
    price_krw: number;
    stock: number;
    main_image_url: string | null;
    category_id: string | null;
    inquiry_number: string | null;
    use_direct_delivery: boolean | null;
    status: string;
  };
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: product.name,
    description: product.short_description ?? '',
    priceKrw: String(product.price_krw),
    priceDisplay: Number(product.price_krw).toLocaleString('ko-KR'),
    stock: String(product.stock),
    imageUrl: product.main_image_url ?? '',
    categoryId: product.category_id ?? '',
    inquiryNumber: product.inquiry_number ?? '',
    useDirectDelivery: product.use_direct_delivery ?? false,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!form.imageUrl) {
      setError('대표 이미지가 필요합니다.');
      return;
    }
    startTransition(async () => {
      const res = await updateSellerProduct({
        productId: product.id,
        name: form.name,
        description: form.description,
        priceKrw: Number(form.priceKrw),
        stock: Number(form.stock),
        imageUrl: form.imageUrl,
        categoryId: form.categoryId || undefined,
        inquiryNumber: form.inquiryNumber,
        useDirectDelivery: form.useDirectDelivery,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      // 1초 후 목록으로
      setTimeout(() => router.push('/seller/products'), 1000);
    });
  };

  const handlePriceChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    const display = digitsOnly ? Number(digitsOnly).toLocaleString('ko-KR') : '';
    setForm({ ...form, priceKrw: digitsOnly, priceDisplay: display });
  };

  const priceNum = Number(form.priceKrw) || 0;
  const priceHint =
    priceNum >= 100000000 ? `${Math.floor(priceNum / 100000000)}억 ${(priceNum % 100000000).toLocaleString()}원`
    : priceNum >= 10000   ? `${Math.floor(priceNum / 10000)}만 ${priceNum % 10000 ? (priceNum % 10000).toLocaleString() : ''}원`
    : priceNum > 0        ? `${priceNum.toLocaleString()}원`
    : '';

  const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: '승인 대기 중', color: '#B45309', bg: '#FEF3C7' },
    approved: { text: '판매 중', color: '#047857', bg: '#D1FAE5' },
    hidden: { text: '비공개', color: '#374151', bg: '#F3F4F6' },
    rejected: { text: '거절됨', color: '#B91C1C', bg: '#FEE2E2' },
  };
  const statusInfo = STATUS_LABEL[product.status] ?? STATUS_LABEL.pending;

  const input =
    'mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
  const label = 'block text-sm font-medium';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 현재 상태 표시 */}
      <div className="rounded-xl bg-gray-50 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">현재 상태</p>
          <span
            className="inline-block mt-1 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: statusInfo.bg, color: statusInfo.color }}
          >
            {statusInfo.text}
          </span>
        </div>
        <p className="text-xs text-gray-500 text-right">
          승인 전/후 모두<br />수정 가능합니다
        </p>
      </div>

      <div>
        <label className={label}>상품명</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={input}
        />
      </div>

      <div>
        <label className={label}>간단 설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className={input}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>가격 (KRW)</label>
          <input
            required
            type="text"
            inputMode="numeric"
            value={form.priceDisplay}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="예: 50,000"
            className={input}
          />
          {priceHint && (
            <p className="mt-1 text-xs text-[#3182F6] font-medium">💰 {priceHint}</p>
          )}
        </div>
        <div>
          <label className={label}>재고</label>
          <input
            required
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>카테고리</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className={input}
        >
          <option value="">선택 안 함</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>대표 이미지 *</label>
        <div className="mt-1">
          <ImagePicker
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
        </div>
      </div>

      <div>
        <label className={label}>문의 번호 / 카카오톡 (선택)</label>
        <input
          value={form.inquiryNumber}
          onChange={(e) => {
            const raw = e.target.value;
            const digitsOnly = raw.replace(/\D/g, '');
            const looksLikePhone =
              /^\d+$/.test(raw.replace(/[\s-]/g, '')) || digitsOnly.length >= 9;
            const formatted = looksLikePhone ? formatPhoneKR(raw) : raw;
            setForm({ ...form, inquiryNumber: formatted });
          }}
          placeholder="예: 010-1234-5678 또는 카톡 ID"
          className={input}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.useDirectDelivery}
          onChange={(e) => setForm({ ...form, useDirectDelivery: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        직접 전달 방식 사용 (택배 송장 없이 직접 전달)
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✓ 저장되었습니다. 목록으로 이동합니다...
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push('/seller/products')}
          className="flex-1 rounded-[14px] border border-gray-300 bg-white text-gray-800 font-semibold py-3 hover:bg-gray-50 transition"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[14px] bg-[#3182F6] text-white font-semibold py-3 disabled:opacity-50 hover:bg-[#1B64DA] transition"
        >
          {pending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </form>
  );
}
