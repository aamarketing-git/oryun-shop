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
      .update({ sections, updated_by: user.id })
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
    .update({ status: 'rejected', rejection_reason: reason })
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
