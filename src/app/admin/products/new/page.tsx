import { createServiceClient } from '@/lib/supabase/server';
import AdminNewProductForm from '@/components/admin/AdminNewProductForm';

export default async function AdminNewProductPage() {
  const supabase = createServiceClient();

  // 승인된 공급자 목록 + 카테고리
  const [{ data: sellers }, { data: categories }] = await Promise.all([
    supabase
      .from('sellers')
      .select('id, business_name, representative_name')
      .eq('status', 'approved')
      .order('business_name'),
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order'),
  ]);

  return (
    <div className="max-w-2xl">
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">상품 직접 등록</h1>
      <p className="mt-2 text-sm text-gray-500">
        관리자가 직접 상품을 만들고 대표 이미지 · 상세페이지까지 한 번에 등록합니다.
      </p>

      <div className="mt-8">
        <AdminNewProductForm
          sellers={sellers ?? []}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
