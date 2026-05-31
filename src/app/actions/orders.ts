'use server';

import { createClient } from '@/lib/supabase/server';
import { isValidTxHash } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

function parseDbError(msg: string): string {
  if (msg.includes('STAKING_WALLET_REQUIRED')) return '오륜 스테이킹 Wallet 주소는 필수입니다.';
  if (msg.includes('OUT_OF_STOCK')) return '재고가 부족합니다.';
  if (msg.includes('TXID_ALREADY_USED'))
    return '이미 사용된 TXID입니다. 다른 거래의 TXID를 입력해주세요.';
  if (msg.includes('PRODUCT_NOT_AVAILABLE')) return '현재 구매할 수 없는 상품입니다.';
  if (msg.includes('ORDER_NOT_PENDING_PAYMENT')) return '이미 결제가 완료된 주문입니다.';
  if (msg.includes('FORBIDDEN')) return '권한이 없습니다.';
  if (msg.includes('AUTH_REQUIRED')) return '로그인이 필요합니다.';
  if (msg.includes('ADMIN_ONLY')) return '관리자만 수행할 수 있습니다.';
  if (msg.includes('DETAIL_PAGE_REQUIRED')) return '상세 페이지가 먼저 등록되어야 합니다.';
  return msg.replace(/^[A-Z_]+:\s*/, '');
}

export async function createOrder(
  formData: FormData,
): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const stakingWallet = (formData.get('staking_wallet_address') as string)?.trim();
  if (!stakingWallet) return { ok: false, error: '오륜 스테이킹 Wallet 주소는 필수입니다.' };

  const productId = formData.get('product_id') as string;
  const paymentMethod = formData.get('payment_method') as 'bank_transfer' | 'usdt';

  const shipping = {
    recipient: formData.get('recipient') ?? '',
    phone: formData.get('phone') ?? '',
    address: formData.get('address') ?? '',
    address_detail: formData.get('address_detail') ?? '',
    postal_code: formData.get('postal_code') ?? '',
  };

  const { data, error } = await supabase.rpc('create_order', {
    p_product_id: productId,
    p_quantity: 1,
    p_payment_method: paymentMethod,
    p_staking_wallet_address: stakingWallet,
    p_shipping: shipping,
  });

  if (error) return { ok: false, error: parseDbError(error.message) };
  revalidatePath('/account/orders');
  return { ok: true, orderId: data as string };
}

export async function submitTxid(input: {
  orderId: string;
  txHash: string;
  chain: 'TRC20' | 'ERC20';
}): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();
  const txHash = input.txHash.trim();
  if (!txHash) return { error: 'TXID를 입력해주세요.' };
  if (!isValidTxHash(txHash, input.chain)) return { error: '유효하지 않은 TXID 형식입니다.' };

  const { error } = await supabase.rpc('submit_txid', {
    p_order_id: input.orderId,
    p_tx_hash: txHash,
    p_chain: input.chain,
  });
  if (error) return { error: parseDbError(error.message) };

  revalidatePath(`/account/orders/${input.orderId}`);
  return { ok: true };
}

export async function confirmPayment(orderId: string): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('confirm_payment', { p_order_id: orderId });
  if (error) return { error: parseDbError(error.message) };
  revalidatePath(`/seller/orders`);
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/admin/orders`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function registerShipment(input: {
  orderId: string;
  method: 'courier' | 'direct';
  carrier?: string;
  trackingNumber?: string;
  note?: string;
}): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc('register_shipment', {
    p_order_id: input.orderId,
    p_method: input.method,
    p_courier_company: input.carrier ?? null,
    p_tracking_number: input.trackingNumber ?? null,
    p_direct_note: input.note ?? null,
  });
  if (error) return { error: parseDbError(error.message) };
  revalidatePath(`/seller/orders`);
  revalidatePath(`/seller/orders/${input.orderId}`);
  revalidatePath(`/account/orders/${input.orderId}`);
  return { ok: true };
}
