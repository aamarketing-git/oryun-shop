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
    .select('id, name, price_krw, main_image_url, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!product) notFound();

  const { data: detail } = await supabase
    .from('product_details')
    .select('*')
    .eq('product_id', params.id)
    .maybeSingle();

  // 기존 sections 중 첫 번째 detail_pdf/detail_image의 URL 추출
  // 옛날 형식(hero/feature 등)이면 첫 번째 항목의 image_url 사용
  let initialDetailUrl = '';
  if (Array.isArray(detail?.sections) && detail.sections.length > 0) {
    const first = detail.sections[0] as any;
    initialDetailUrl = first.url || first.image_url || first.image || '';
  }

  return (
    <div className="max-w-2xl">
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        대표 이미지와 상세 페이지(이미지 또는 PDF)를 업로드하세요.
      </p>

      <div className="mt-8">
        <ProductDetailEditor
          productId={product.id}
          productStatus={product.status}
          initialMainImage={product.main_image_url ?? ''}
          initialDetailUrl={initialDetailUrl}
        />
      </div>
    </div>
  );
}
