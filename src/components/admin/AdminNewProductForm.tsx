'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminProduct } from '@/app/actions/products';
import { formatPhoneKR } from '@/lib/utils';
import { ImagePicker } from '@/components/ui/ImagePicker';

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? Number(n.replace(/\D/g, '')) : n;
  if (!num || isNaN(num)) return '';
  return num.toLocaleString('ko-KR');
}

export default function AdminNewProductForm({
  sellers,
  categories,
}: {
  sellers: { id: string; business_name: string; representative_name: string | null }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    sellerId: '',
    name: '',
    description: '',
    priceKrw: '',
    priceDisplay: '',
    stock: '0',
    imageUrl: '',
    categoryId: '',
    inquiryNumber: '',
    useDirectDelivery: false,
    autoApprove: true, // 관리자 등록은 기본 즉시 승인
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.sellerId) {
      setError('공급자를 선택해주세요.');
      return;
    }
    startTransition(async () => {
      const res = await createAdminProduct({
        sellerId: form.sellerId,
        name: form.name,
        description: form.description,
        priceKrw: Number(form.priceKrw),
        stock: Number(form.stock),
        imageUrl: form.imageUrl,
        categoryId: form.categoryId || undefined,
        inquiryNumber: form.inquiryNumber,
        useDirectDelivery: form.useDirectDelivery,
        autoApprove: form.autoApprove,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      // 상세페이지 편집으로 바로 이동
      if (res.productId) {
        router.push(`/admin/products/${res.productId}/detail`);
      } else {
        router.push('/admin/products');
      }
    });
  };

  const handlePriceChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    const display = digitsOnly ? Number(digitsOnly).toLocaleString('ko-KR') : '';
    setForm({ ...form, priceKrw: digitsOnly, priceDisplay: display });
  };

  const priceNum = Number(form.priceKrw) || 0;
  const priceHint =
    priceNum >= 100000000 ? `${Math.floor(priceNum / 100000000)}억 ${formatNumber(priceNum % 100000000)}원`
    : priceNum >= 10000   ? `${Math.floor(priceNum / 10000)}만 ${priceNum % 10000 ? formatNumber(priceNum % 10000) : ''}원`
    : priceNum > 0        ? `${formatNumber(priceNum)}원`
    : '';

  const input =
    'mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
  const label = 'block text-sm font-medium';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 안내 */}
      <div className="rounded-2xl bg-[#E8F1FE] border border-[#C7DCFC] p-4 text-sm text-[#1B64DA]">
        <p className="font-semibold mb-1">👨‍💼 관리자 직접 등록</p>
        <p className="text-xs">
          관리자는 공급자를 선택하고 대표 이미지·상세페이지를 함께 업로드할 수 있어요.
          "즉시 승인" 체크 시 등록과 동시에 판매 시작됩니다.
        </p>
      </div>

      {/* 공급자 선택 */}
      <div>
        <label className={label}>공급자 *</label>
        <select
          required
          value={form.sellerId}
          onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
          className={input}
        >
          <option value="">공급자를 선택하세요</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.business_name}
              {s.representative_name ? ` (${s.representative_name})` : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          승인된 공급자 중에서 선택하세요.
        </p>
      </div>

      <div>
        <label className={label}>상품명 *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 오륜 미네랄 원액 500ml"
          className={input}
        />
      </div>

      <div>
        <label className={label}>간단 설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="상품 카드 등에 표시되는 짧은 설명"
          className={input}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>가격 (KRW) *</label>
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
          <label className={label}>재고 *</label>
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

      {/* 대표 이미지 — 관리자는 등록 시 바로 가능 */}
      <div>
        <label className={label}>대표 이미지</label>
        <div className="mt-1">
          <ImagePicker
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          파일 업로드 또는 URL 입력. 등록 후 상세페이지도 바로 작성할 수 있어요.
        </p>
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

      <div className="space-y-2 rounded-xl bg-gray-50 p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.useDirectDelivery}
            onChange={(e) => setForm({ ...form, useDirectDelivery: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          직접 전달 방식 사용
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoApprove}
            onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <strong>즉시 승인하기</strong>
          <span className="text-xs text-gray-500">(체크 해제 시 "승인 대기" 상태로 등록)</span>
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="flex-1 rounded-[14px] border border-gray-300 bg-white text-gray-800 font-semibold py-3 hover:bg-gray-50 transition"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[14px] bg-[#3182F6] text-white font-semibold py-3 disabled:opacity-50 hover:bg-[#1B64DA] transition"
        >
          {pending ? '등록 중...' : form.autoApprove ? '등록 + 즉시 승인' : '등록 (승인 대기)'}
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        등록 후 상세페이지 편집 화면으로 이동합니다.
      </p>
    </form>
  );
}
