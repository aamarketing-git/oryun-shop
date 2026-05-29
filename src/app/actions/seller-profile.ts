"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SellerUpdate = {
  business_name?: string;
  representative_name?: string;
  contact_phone?: string;
  contact_kakao?: string | null;
  contact_telegram?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder?: string | null;
  usdt_wallet_trc20?: string | null;
  usdt_wallet_erc20?: string | null;
};

export async function updateSellerProfile(input: SellerUpdate): Promise<{ ok?: true; error?: string }> {
  const supabase = createClient();

  // 본인 인증
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 본인의 sellers 행만 수정 (RLS도 막아주지만 안전하게 user_id로 한 번 더)
  const { error } = await supabase
    .from("sellers")
    .update(input)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/seller/settings");
  return { ok: true };
}
