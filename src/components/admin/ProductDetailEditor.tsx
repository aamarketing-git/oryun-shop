'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveProductDetail, approveProduct, updateProductMainImage } from '@/app/actions/products';
import { FilePicker } from '@/components/ui/FilePicker';

/**
 * 단순화된 상품 편집기.
 * - 대표 이미지 (필수)
 * - 상세 페이지 (이미지 1장 또는 PDF 1개 — 선택)
 * - 승인 대기 상품엔 "저장 + 즉시 승인" 버튼
 */
export default function ProductDetailEditor({
  productId,
  productStatus,
  initialMainImage,
  initialDetailUrl,
}: {
  productId: string;
  productStatus?: string;
  initialMainImage?: string;
  initialDetailUrl?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'main' | 'detail'>('main');

  const [mainImage, setMainImage] = useState(initialMainImage ?? '');
  const [detailUrl, setDetailUrl] = useState(initialDetailUrl ?? '');

  const save = async (approveAfter = false) => {
    setError(null);
    setSavedMsg(null);

    if (!mainImage) {
      setError('대표 이미지를 등록해주세요.');
      setTab('main');
      return;
    }

    // 1. 대표 이미지 저장
    const r1 = await updateProductMainImage({ productId, imageUrl: mainImage });
    if (r1.error) {
      setError('대표 이미지 저장 실패: ' + r1.error);
      return;
    }

    // 2. 상세 페이지 저장 (detailUrl 있으면 단일 섹션, 없으면 빈 배열)
    const isPdf = detailUrl.toLowerCase().endsWith('.pdf') || detailUrl.includes('.pdf?');
    const sections = detailUrl
      ? [{ type: isPdf ? 'detail_pdf' : 'detail_image', url: detailUrl }]
      : [];

    const r2 = await saveProductDetail({ productId, sections });
    if (r2.error) {
      setError('상세 페이지 저장 실패: ' + r2.error);
      return;
    }

    // 3. 즉시 승인 옵션
    if (approveAfter && productStatus === 'pending') {
      const r3 = await approveProduct(productId);
      if (r3?.error) {
        setError('승인 실패: ' + r3.error);
        return;
      }
      setSavedMsg('✓ 저장 및 승인 완료 — 홈에 노출됩니다');
      setTimeout(() => router.push('/admin/products?status=approved'), 1200);
      return;
    }

    setSavedMsg('✓ 저장되었습니다');
    router.refresh();
  };

  const isPending = productStatus === 'pending';
  const isApproved = productStatus === 'approved';

  return (
    <div className="space-y-6">
      {/* 탭 — 대표이미지 / 상세페이지 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('main')}
          className={`flex-1 px-4 py-2.5 text-sm rounded-lg transition font-semibold ${
            tab === 'main'
              ? 'bg-white text-[#3182F6] shadow-sm'
              : 'text-gray-600'
          }`}
        >
          {mainImage && '✓ '}대표 이미지
        </button>
        <button
          type="button"
          onClick={() => setTab('detail')}
          className={`flex-1 px-4 py-2.5 text-sm rounded-lg transition font-semibold ${
            tab === 'detail'
              ? 'bg-white text-[#3182F6] shadow-sm'
              : 'text-gray-600'
          }`}
        >
          {detailUrl && '✓ '}상세 페이지
        </button>
      </div>

      {/* 대표 이미지 탭 */}
      {tab === 'main' && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">대표 이미지 *</h3>
            <p className="text-sm text-gray-500">
              상품 카드와 상품 페이지 상단에 표시되는 이미지입니다.
            </p>
          </div>
          <FilePicker
            value={mainImage}
            onChange={setMainImage}
            accept="image/*"
            maxSizeMB={5}
          />
        </div>
      )}

      {/* 상세 페이지 탭 */}
      {tab === 'detail' && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">상세 페이지 (선택)</h3>
            <p className="text-sm text-gray-500">
              상품 페이지 하단에 표시될 상세 설명 파일 한 개를 업로드하세요.
              <br />
              지원: <strong>JPG · PNG · WebP · PDF</strong>
            </p>
          </div>
          <FilePicker
            value={detailUrl}
            onChange={setDetailUrl}
            accept="image/*,application/pdf"
            maxSizeMB={10}
          />
        </div>
      )}

      {/* 에러/성공 메시지 */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {savedMsg}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="border-t border-gray-200 pt-5 space-y-3">
        {isPending ? (
          <>
            <button
              type="button"
              onClick={() => startTransition(() => save(true))}
              disabled={pending}
              className="w-full rounded-[14px] bg-[#3182F6] text-white font-semibold py-3.5 disabled:opacity-50 hover:bg-[#1B64DA] transition"
            >
              {pending ? '처리 중...' : '✓ 저장 후 상품 등록 신청 승인'}
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => save(false))}
              disabled={pending}
              className="w-full rounded-[14px] border border-gray-300 bg-white text-gray-800 font-semibold py-3 disabled:opacity-50 hover:bg-gray-50 transition"
            >
              저장만 (승인 보류)
            </button>
            <p className="text-xs text-center text-gray-500">
              💡 <strong>승인 전</strong> 상품입니다. "저장 후 승인"을 누르면 즉시 홈에 노출됩니다.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => startTransition(() => save(false))}
              disabled={pending}
              className="w-full rounded-[14px] bg-[#3182F6] text-white font-semibold py-3.5 disabled:opacity-50 hover:bg-[#1B64DA] transition"
            >
              {pending ? '저장 중...' : '저장하기'}
            </button>
            {isApproved && (
              <p className="text-xs text-center text-green-700">
                ✓ 이미 승인됨 — 상세 수정 후 "저장"만 누르면 됩니다
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
