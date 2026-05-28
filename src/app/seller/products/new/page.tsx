import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewProductForm from '@/components/seller/NewProductForm';

export default async function NewProductPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">상품 등록</h1>
      <p className="mt-1 text-sm text-gray-500">
        등록 후 관리자가 상세페이지를 작성하고 승인하면 노출됩니다.
      </p>

      <div className="mt-8">
        <NewProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
