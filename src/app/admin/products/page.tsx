import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { formatKRW } from '@/lib/utils';
import ProductActions from '@/components/admin/ProductActions';

const STATUS_LABEL: Record<string, string> = {
  draft: '작성중',
  pending: '승인 대기',
  approved: '승인됨',
  hidden: '비공개',
  rejected: '거절',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-200 text-gray-700',
  rejected: 'bg-red-100 text-red-700',
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createServiceClient();
  const status = searchParams.status ?? 'pending';

  let query = supabase
    .from('products')
    .select('*, sellers(business_name), product_details(id), categories(name)')
    .order('created_at', { ascending: false });

  if (status !== 'all') query = query.eq('status', status);

  const { data: products } = await query;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="section-eyebrow">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">상품 관리</h1>
          <p className="mt-2 text-sm text-gray-500">
            공급자가 신청한 상품을 승인하거나, 관리자가 직접 등록할 수 있어요.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#1B64DA] transition whitespace-nowrap"
        >
          + 상품 직접 등록
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {['pending', 'approved', 'hidden', 'rejected', 'draft', 'all'].map((s) => (
          <Link
            key={s}
            href={`/admin/products?status=${s}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              status === s
                ? 'border-black bg-black text-white'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            {s === 'all' ? '전체' : STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">상품</th>
              <th className="px-6 py-3">공급자</th>
              <th className="px-6 py-3">카테고리</th>
              <th className="px-6 py-3 text-right">가격</th>
              <th className="px-6 py-3 text-center">재고</th>
              <th className="px-6 py-3 text-center">상세</th>
              <th className="px-6 py-3 text-center">상태</th>
              <th className="px-6 py-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {p.main_image_url ? (
                      <img
                        src={p.main_image_url}
                        alt=""
                        className="h-12 w-12 rounded-lg bg-gray-50 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-[10px] font-medium flex-shrink-0 leading-tight text-center">
                        이미지<br/>없음
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {String(p.id).slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{p.sellers?.business_name}</td>
                <td className="px-6 py-4 text-gray-600">{p.categories?.name ?? '—'}</td>
                <td className="px-6 py-4 text-right">{formatKRW(Number(p.price_krw))}</td>
                <td className="px-6 py-4 text-center">{p.stock}</td>
                <td className="px-6 py-4 text-center">
                  {p.product_details && p.product_details.length > 0 ? (
                    <Link href={`/admin/products/${p.id}/detail`} className="link-apple text-xs">
                      편집
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/products/${p.id}/detail`}
                      className="text-xs text-red-600 underline"
                    >
                      필요
                    </Link>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLOR[p.status] ?? 'bg-gray-100'
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ProductActions
                    productId={p.id}
                    status={p.status}
                    hasDetail={(p.product_details?.length ?? 0) > 0}
                  />
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  해당 상태의 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
