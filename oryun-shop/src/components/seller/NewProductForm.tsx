'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSellerProduct } from '@/app/actions/products';

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
    stock: '0',
    imageUrl: '',
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
        imageUrl: form.imageUrl,
        categoryId: form.categoryId || undefined,
        inquiryNumber: form.inquiryNumber,
        useDirectDelivery: form.useDirectDelivery,
      });
      if (res?.error) setError(res.error);
      else router.push('/seller/products');
    });
  };

  const input =
    'mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none';
  const label = 'block text-sm font-medium';

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
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
            type="number"
            min={0}
            value={form.priceKrw}
            onChange={(e) => setForm({ ...form, priceKrw: e.target.value })}
            className={input}
          />
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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>대표 이미지 URL</label>
        <input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://…"
          className={input}
        />
        <p className="mt-1 text-xs text-gray-500">
          Supabase Storage에 업로드한 이미지의 공개 URL을 입력하세요.
        </p>
      </div>

      <div>
        <label className={label}>문의 번호 (선택)</label>
        <input
          value={form.inquiryNumber}
          onChange={(e) => setForm({ ...form, inquiryNumber: e.target.value })}
          placeholder="예: 010-0000-0000"
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

      <button type="submit" disabled={pending} className="btn-apple">
        {pending ? '등록 중…' : '상품 등록 요청'}
      </button>
    </form>
  );
}
