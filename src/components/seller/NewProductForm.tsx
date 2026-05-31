'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSellerProduct } from '@/app/actions/products';
import { formatPhoneKR } from '@/lib/utils';

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? Number(n.replace(/\D/g, '')) : n;
  if (!num || isNaN(num)) return '';
  return num.toLocaleString('ko-KR');
}

export default function NewProductForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    priceKrw: '',
    priceDisplay: '',
    stock: '0',
    categoryId: '',
    inquiryNumber: '',
    useDirectDelivery: false,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSellerProduct({
        name: form.name,
        description: form.description,
        priceKrw: Number(form.priceKrw),
        stock: Number(form.stock),
        imageUrl: '',  // 이미지는 승인 후에 업로드
        categoryId: form.categoryId || undefined,
        inquiryNumber: form.inquiryNumber,
        useDirectDelivery: form.useDirectDelivery,
      });
      if (res?.error) setError(res.error);
      else router.push('/seller/products');
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
      {/* 흐름 안내 */}
      <div className="rounded-2xl bg-[#E8F1FE] border border-[#C7DCFC] p-4 text-sm">
        <p className="font-semibold text-[#1B64DA] mb-2">📋 상품 등록 흐름</p>
        <ol className="space-y-1 text-[#1B64DA] ml-4 list-decimal">
          <li><strong>1단계 (지금)</strong>: 기본 정보 입력 후 승인 신청</li>
          <li><strong>2단계</strong>: 관리자 승인 → 상품 코드 발급</li>
          <li><strong>3단계 (승인 후)</strong>: "수정" 버튼에서 대표 이미지와 상세 페이지 업로드</li>
        </ol>
        <p className="mt-3 text-xs text-[#1B64DA]/80">
          ⚠️ 이미지와 상세페이지는 <strong>승인 후</strong>에만 업로드할 수 있습니다.
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
          placeholder="상품을 간단히 설명해주세요. 상세 페이지는 승인 후 따로 등록합니다."
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
            <p className="mt-1 text-xs text-[#3182F6] font-medium">
              💰 {priceHint}
            </p>
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
        <p className="mt-1 text-xs text-gray-500">
          숫자만 입력하면 전화번호 형식으로 자동 변환됩니다.
        </p>
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

      <button type="submit" disabled={pending} className="btn-apple">
        {pending ? '신청 중…' : '승인 요청'}
      </button>
    </form>
  );
}
