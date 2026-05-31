import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditProductForm from '@/components/seller/EditProductForm';

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 본인 sellers 확인
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, status')
    .eq('user_id', user.id)
    .single();
  if (!seller) redirect('/');
  if (seller.status !== 'approved') redirect('/seller/pending');

  // 본인 상품 가져오기
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('seller_id', seller.id)  // 본인 것만
    .single();
  if (!product) notFound();

  // 카테고리 목록
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('sort_order');

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">상품 수정</h1>
      <p className="mt-2 text-sm text-gray-500">
        가격, 재고, 이미지 등을 변경할 수 있어요. 저장 즉시 반영됩니다.
      </p>

      <div className="mt-8 max-w-2xl">
        <EditProductForm product={product} categories={categories ?? []} />
      </div>
    </div>
  );
}
