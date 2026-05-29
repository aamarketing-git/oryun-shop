'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveProductDetail, approveProduct } from '@/app/actions/products';

type Section =
  | { type: 'hero'; title: string; subtitle?: string; image_url?: string }
  | { type: 'feature'; title: string; body: string; image_url?: string; align?: 'left' | 'right' }
  | { type: 'spec'; title: string; rows: { label: string; value: string }[] }
  | { type: 'gallery'; images: string[] }
  | { type: 'callout'; eyebrow?: string; title: string; body?: string };

const SECTION_TYPES: { type: Section['type']; label: string; description: string }[] = [
  { type: 'hero', label: 'Hero', description: '큰 타이틀 + 서브 + 이미지' },
  { type: 'feature', label: 'Feature', description: '제품 특징 강조 블록' },
  { type: 'spec', label: 'Specs', description: '사양 테이블' },
  { type: 'gallery', label: 'Gallery', description: '이미지 갤러리' },
  { type: 'callout', label: 'Callout', description: '강조 메시지' },
];

function emptySection(type: Section['type']): Section {
  switch (type) {
    case 'hero':
      return { type, title: '', subtitle: '', image_url: '' };
    case 'feature':
      return { type, title: '', body: '', image_url: '', align: 'left' };
    case 'spec':
      return { type, title: '제품 사양', rows: [{ label: '', value: '' }] };
    case 'gallery':
      return { type, images: [''] };
    case 'callout':
      return { type, eyebrow: '', title: '', body: '' };
  }
}

export default function ProductDetailEditor({
  productId,
  productStatus,
  existingId,
  initialSections,
}: {
  productId: string;
  productStatus?: string;
  existingId?: string;
  initialSections: Section[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(initialSections.length ? initialSections : []);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const addSection = (type: Section['type']) => {
    setSections([...sections, emptySection(type)]);
  };

  const updateSection = (idx: number, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? ({ ...s, ...patch } as Section) : s)),
    );
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveProductDetail({ productId, existingId, sections });
      if (res?.error) setMessage('오류: ' + res.error);
      else setMessage('저장되었습니다.');
    });
  };

  // 저장 후 곧바로 승인까지 한 번에
  const saveAndApprove = () => {
    if (sections.length === 0) {
      setMessage('상세페이지에 섹션을 1개 이상 추가해주세요.');
      return;
    }
    if (!confirm('상세페이지를 저장하고 상품을 승인하시겠습니까?\n승인 후 즉시 사이트에 노출됩니다.')) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      // 1) 상세페이지 저장
      const saveRes = await saveProductDetail({ productId, existingId, sections });
      if (saveRes?.error) {
        setMessage('저장 오류: ' + saveRes.error);
        return;
      }
      // 2) 승인
      const approveRes = await approveProduct(productId);
      if (approveRes?.error) {
        setMessage('승인 오류: ' + approveRes.error + ' (상세페이지는 저장되었습니다.)');
        return;
      }
      setMessage('✓ 저장 및 승인 완료 — 상품관리로 이동합니다.');
      // 3) 상품관리 페이지로 이동
      setTimeout(() => {
        router.push('/admin/products?status=approved');
        router.refresh();
      }, 800);
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* 편집 영역 */}
      <div className="space-y-6">
        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            아직 섹션이 없습니다. 오른쪽 패널에서 섹션을 추가하세요.
          </div>
        )}

        {sections.map((section, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-black px-3 py-0.5 text-xs font-medium text-white">
                  {SECTION_TYPES.find((s) => s.type === section.type)?.label}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => moveSection(idx, -1)} className="text-gray-500 hover:text-black">
                  ↑
                </button>
                <button onClick={() => moveSection(idx, 1)} className="text-gray-500 hover:text-black">
                  ↓
                </button>
                <button onClick={() => removeSection(idx)} className="text-red-600 hover:underline">
                  삭제
                </button>
              </div>
            </div>

            <SectionForm section={section} onChange={(p) => updateSection(idx, p)} />
          </div>
        ))}

        {sections.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-[14px] border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                {saving ? '저장 중…' : '상세페이지만 저장'}
              </button>

              {/* 저장 후 승인: 승인 대기 상태일 때만 표시 */}
              {productStatus === 'pending' && (
                <button
                  onClick={saveAndApprove}
                  disabled={saving}
                  className="rounded-[14px] bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50 transition"
                >
                  {saving ? '처리 중…' : '✓ 저장 후 승인'}
                </button>
              )}

              {/* 이미 승인된 상품은 안내 */}
              {productStatus === 'approved' && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  ✓ 이미 승인됨 — 상세 수정 후 "저장"만 누르면 됩니다
                </span>
              )}
            </div>
            {message && (
              <p className={`text-sm ${message.startsWith('✓') ? 'text-green-700' : message.startsWith('오류') || message.startsWith('저장 오류') || message.startsWith('승인 오류') ? 'text-red-600' : 'text-gray-600'}`}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 사이드: 섹션 추가 */}
      <aside className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-gray-500">섹션 추가</p>
        {SECTION_TYPES.map((s) => (
          <button
            key={s.type}
            onClick={() => addSection(s.type)}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-black"
          >
            <p className="font-medium">{s.label}</p>
            <p className="mt-1 text-xs text-gray-500">{s.description}</p>
          </button>
        ))}

        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
          이 편집기로 만든 섹션만 노출되며, 통일된 디자인 시스템을 따릅니다. 공급자는 임의로 수정할 수 없습니다.
        </div>
      </aside>
    </div>
  );
}

function SectionForm({ section, onChange }: { section: Section; onChange: (p: any) => void }) {
  const input =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none';
  const label = 'block text-xs font-medium text-gray-700';

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <div>
            <label className={label}>타이틀</label>
            <input
              className={input}
              value={section.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>서브타이틀</label>
            <input
              className={input}
              value={section.subtitle ?? ''}
              onChange={(e) => onChange({ subtitle: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>이미지 URL</label>
            <input
              className={input}
              value={section.image_url ?? ''}
              onChange={(e) => onChange({ image_url: e.target.value })}
            />
          </div>
        </div>
      );
    case 'feature':
      return (
        <div className="space-y-3">
          <div>
            <label className={label}>타이틀</label>
            <input
              className={input}
              value={section.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>본문</label>
            <textarea
              className={input}
              rows={4}
              value={section.body}
              onChange={(e) => onChange({ body: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>이미지 URL</label>
            <input
              className={input}
              value={section.image_url ?? ''}
              onChange={(e) => onChange({ image_url: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>정렬</label>
            <select
              className={input}
              value={section.align ?? 'left'}
              onChange={(e) => onChange({ align: e.target.value })}
            >
              <option value="left">이미지 왼쪽</option>
              <option value="right">이미지 오른쪽</option>
            </select>
          </div>
        </div>
      );
    case 'spec':
      return (
        <div className="space-y-3">
          <div>
            <label className={label}>타이틀</label>
            <input
              className={input}
              value={section.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>사양 항목</label>
            {section.rows.map((row, i) => (
              <div key={i} className="mt-2 flex gap-2">
                <input
                  className={input + ' flex-1'}
                  placeholder="항목 (예: 무게)"
                  value={row.label}
                  onChange={(e) => {
                    const rows = [...section.rows];
                    rows[i] = { ...rows[i], label: e.target.value };
                    onChange({ rows });
                  }}
                />
                <input
                  className={input + ' flex-1'}
                  placeholder="값 (예: 1.2kg)"
                  value={row.value}
                  onChange={(e) => {
                    const rows = [...section.rows];
                    rows[i] = { ...rows[i], value: e.target.value };
                    onChange({ rows });
                  }}
                />
                <button
                  onClick={() => onChange({ rows: section.rows.filter((_, j) => j !== i) })}
                  className="px-2 text-xs text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ rows: [...section.rows, { label: '', value: '' }] })}
              className="mt-2 text-xs text-blue-600"
            >
              + 항목 추가
            </button>
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-2">
          <label className={label}>이미지 URL 목록</label>
          {section.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={input + ' flex-1'}
                value={url}
                onChange={(e) => {
                  const images = [...section.images];
                  images[i] = e.target.value;
                  onChange({ images });
                }}
              />
              <button
                onClick={() => onChange({ images: section.images.filter((_, j) => j !== i) })}
                className="px-2 text-xs text-red-600"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ images: [...section.images, ''] })}
            className="text-xs text-blue-600"
          >
            + 이미지 추가
          </button>
        </div>
      );
    case 'callout':
      return (
        <div className="space-y-3">
          <div>
            <label className={label}>Eyebrow</label>
            <input
              className={input}
              value={section.eyebrow ?? ''}
              onChange={(e) => onChange({ eyebrow: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>타이틀</label>
            <input
              className={input}
              value={section.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>본문</label>
            <textarea
              className={input}
              rows={3}
              value={section.body ?? ''}
              onChange={(e) => onChange({ body: e.target.value })}
            />
          </div>
        </div>
      );
  }
}
