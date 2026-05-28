import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import ProductDetailEditor from '@/components/admin/ProductDetailEditor';

export default async function AdminProductDetailEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServiceClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, price_krw, image_url, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!product) notFound();

  const { data: detail } = await supabase
    .from('product_details')
    .select('*')
    .eq('product_id', params.id)
    .maybeSingle();

  return (
    <div>
      <p className="section-eyebrow">Admin · Detail Builder</p>
      <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        통일된 디자인 시스템을 기반으로 상세페이지를 구성합니다. 공급자는 수정할 수 없습니다.
      </p>

      <div className="mt-8">
        <ProductDetailEditor
          productId={product.id}
          existingId={detail?.id}
          initialSections={detail?.sections ?? []}
        />
      </div>
    </div>
  );
}
