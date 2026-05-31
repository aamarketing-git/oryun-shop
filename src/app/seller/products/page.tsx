import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatKRW } from '@/lib/utils';
import { ResubmitButton } from '@/components/seller/ResubmitButton';

const STATUS_LABEL: Record<string, string> = {
  draft: '작성중',
  pending: '승인 대기',
  approved: '판매중',
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

export default async function SellerProductsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single();
  if (!seller) redirect('/');

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="section-eyebrow">Seller</p>
          <h1 className="mt-2 text-3xl font-semibold">내 상품</h1>
        </div>
        <Link href="/seller/products/new" className="btn-apple">
          상품 등록
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">상품명</th>
              <th className="px-6 py-3">카테고리</th>
              <th className="px-6 py-3 text-right">가격</th>
              <th className="px-6 py-3 text-center">재고</th>
              <th className="px-6 py-3 text-center">상태</th>
              <th className="px-6 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.flatMap((p: any) => {
              const rows = [
                <tr key={p.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.main_image_url && (
                        <img
                          src={p.main_image_url}
                          alt=""
                          className="h-10 w-10 rounded-lg bg-gray-50 object-cover"
                        />
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{p.categories?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-right">{formatKRW(Number(p.price_krw))}</td>
                  <td className="px-6 py-4 text-center">{p.stock}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLOR[p.status] ?? 'bg-gray-100'
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`/seller/products/${p.id}/edit`}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        수정
                      </a>
                      {p.status === 'rejected' && (
                        <ResubmitButton productId={p.id} />
                      )}
                    </div>
                  </td>
                </tr>,
              ];
              if (p.status === 'rejected' && p.rejected_reason) {
                rows.push(
                  <tr key={`${p.id}-reason`} className="bg-red-50">
                    <td colSpan={6} className="px-6 py-3">
                      <div className="flex items-start gap-2 text-xs text-red-700">
                        <span className="font-semibold flex-shrink-0">⚠ 거절 사유:</span>
                        <span>{p.rejected_reason}</span>
                      </div>
                    </td>
                  </tr>
                );
              }
              return rows;
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  등록된 상품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-600 space-y-1">
        <p>ℹ️ 상품 등록 후 관리자가 상세페이지를 작성하고 승인하면 노출됩니다.</p>
        <p>거절된 상품은 정보를 수정한 후 <strong>재요청</strong> 버튼으로 다시 승인을 요청할 수 있습니다.</p>
      </div>
    </div>
  );
}
