"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm({ isSeller }: { isSeller: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const name = fd.get("name") as string;

    const supabase = createClient();
    // 1. auth.users 생성 → trigger가 profiles row 자동 생성
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });

    if (signUpErr || !signUp.user) {
      setError(signUpErr?.message ?? "회원가입에 실패했습니다.");
      setLoading(false); return;
    }

    // 2. 이름 업데이트
    await supabase.from("profiles").update({ name, phone: fd.get("phone") as string }).eq("id", signUp.user.id);

    // 3. 공급자 신청 시 sellers row 생성
    if (isSeller) {
      const { error: sellerErr } = await supabase.from("sellers").insert({
        user_id: signUp.user.id,
        business_name: fd.get("business_name") as string,
        representative_name: name,
        contact_phone: fd.get("phone") as string,
        bank_name: fd.get("bank_name") as string,
        bank_account_number: fd.get("bank_account_number") as string,
        bank_account_holder: fd.get("bank_account_holder") as string,
        usdt_wallet_trc20: (fd.get("usdt_wallet") as string) || null,
        status: "pending",
      });
      if (sellerErr) {
        setError("공급자 정보 저장 실패: " + sellerErr.message);
        setLoading(false); return;
      }
    }

    setLoading(false);
    router.push(isSeller ? "/seller/pending" : "/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field name="email" type="email" label="이메일" required />
      <Field name="password" type="password" label="비밀번호" required minLength={8} />
      <Field name="name" label={isSeller ? "대표자 이름" : "이름"} required />
      <Field name="phone" label="연락처" required />

      {isSeller && (
        <>
          <hr className="my-6 border-border" />
          <h3 className="text-sm font-medium">공급자 정보</h3>
          <Field name="business_name" label="상호명" required />
          <Field name="bank_name" label="은행명" required />
          <Field name="bank_account_number" label="계좌번호" required />
          <Field name="bank_account_holder" label="예금주" required />
          <Field name="usdt_wallet" label="USDT 지갑 주소 (TRC20)" />
          {/* 사업자등록증 업로드는 Storage 통해 별도 처리 */}
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-apple w-full">
        {loading ? "처리 중..." : isSeller ? "공급자 신청" : "가입하기"}
      </button>
    </form>
  );
}

function Field({
  name, label, type = "text", required, minLength,
}: { name: string; label: string; type?: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
      />
    </div>
  );
}
