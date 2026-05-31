'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function saveProductDetail({
  productId,
  existingId,
  sections,
}: {
  productId: string;
  existingId?: string;
  sections: any[];
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '인증이 필요합니다' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: '관리자만 상세페이지를 편집할 수 있습니다' };

  const admin = createServiceClient();

  if (existingId) {
    const { error } = await admin
      .from('product_details')
      .update({ sections })
      .eq('id', existingId);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from('product_details')
      .insert({ product_id: productId, sections, created_by: user.id });
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}/detail`);
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function approveProduct(productId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc('approve_product', { p_product_id: productId });
  if (error) {
    if (error.message.includes('DETAIL_PAGE_REQUIRED'))
      return { error: '상세페이지가 등록되어야 승인할 수 있습니다.' };
    return { error: error.message };
  }
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function rejectProduct(productId: string, reason: string) {
  const admin = createServiceClient();
  const { error } = await admin
    .from('products')
    .update({ status: 'rejected', rejected_reason: reason })
    .eq('id', productId);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function hideProduct(productId: string) {
  const admin = createServiceClient();
  const { error } = await admin.from('products').update({ status: 'hidden' }).eq('id', productId);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function updateProductPrice(productId: string, priceKrw: number) {
  const admin = createServiceClient();
  const { error } = await admin.from('products').update({ price_krw: priceKrw }).eq('id', productId);
  if (error) return { error: error.message };
  revalidatePath('/admin/products');
  return { ok: true };
}

// 공급자: 거절된 상품을 수정 후 재등록 요청 (rejected → pending)
export async function resubmitProduct(productId: string): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, status')
    .eq('user_id', user.id)
    .single();
  if (!seller) return { error: '공급자 계정이 아닙니다.' };
  if (seller.status !== 'approved') return { error: '승인된 공급자만 재요청할 수 있습니다.' };

  const { data: product } = await supabase
    .from('products')
    .select('id, status, seller_id')
    .eq('id', productId)
    .single();
  if (!product) return { error: '상품을 찾을 수 없습니다.' };
  if (product.seller_id !== seller.id) return { error: '본인의 상품만 재요청할 수 있습니다.' };
  if (product.status !== 'rejected') return { error: '거절된 상품만 재요청할 수 있습니다.' };

  const { error } = await supabase
    .from('products')
    .update({ status: 'pending', rejected_reason: null })
    .eq('id', productId);

  if (error) return { error: error.message };
  revalidatePath('/seller/products');
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function createSellerProduct(input: {
  name: string;
  description: string;
  priceKrw: number;
  stock: number;
  imageUrl: string;
  categoryId?: string;
  inquiryNumber?: string;
  useDirectDelivery?: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: '인증이 필요합니다' };

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, status')
    .eq('user_id', user.id)
    .single();

  if (!seller) return { error: '공급자로 등록되지 않았습니다' };
  if (seller.status !== 'approved') return { error: '승인된 공급자만 상품을 등록할 수 있습니다' };

  const { data, error } = await supabase
    .from('products')
    .insert({
      seller_id: seller.id,
      name: input.name,
      short_description: input.description,
      price_krw: input.priceKrw,
      stock: input.stock,
      main_image_url: input.imageUrl,
      category_id: input.categoryId || null,
      inquiry_number: input.inquiryNumber || null,
      use_direct_delivery: input.useDirectDelivery ?? false,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/seller/products');
  return { ok: true, productId: data.id };
}

// 공급자: 본인 상품 수정 (status 무관 — pending/approved/rejected/hidden 모두 가능)
// status가 approved여도 수정은 허용. (price/stock/image 등 자유롭게)
// 단, status는 변경 못함 (그건 관리자 권한)
export async function updateSellerProduct(input: {
  productId: string;
  name: string;
  description: string;
  priceKrw: number;
  stock: number;
  imageUrl: string;
  categoryId?: string;
  inquiryNumber?: string;
  useDirectDelivery?: boolean;
}): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  // 본인 sellers 확인
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, status')
    .eq('user_id', user.id)
    .single();
  if (!seller) return { error: '공급자 계정이 아닙니다.' };
  if (seller.status !== 'approved') return { error: '승인된 공급자만 상품을 수정할 수 있습니다.' };

  // 본인 상품인지 확인
  const { data: product } = await supabase
    .from('products')
    .select('id, seller_id, status')
    .eq('id', input.productId)
    .single();
  if (!product) return { error: '상품을 찾을 수 없습니다.' };
  if (product.seller_id !== seller.id) return { error: '본인의 상품만 수정할 수 있습니다.' };

  // 가격/재고/이미지 등 업데이트
  const { error } = await supabase
    .from('products')
    .update({
      name: input.name,
      short_description: input.description,
      price_krw: input.priceKrw,
      stock: input.stock,
      main_image_url: input.imageUrl,
      category_id: input.categoryId || null,
      inquiry_number: input.inquiryNumber || null,
      use_direct_delivery: input.useDirectDelivery ?? false,
    })
    .eq('id', input.productId);

  if (error) return { error: error.message };
  revalidatePath('/seller/products');
  revalidatePath(`/products/${input.productId}`);
  return { ok: true };
}
