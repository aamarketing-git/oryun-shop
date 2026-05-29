"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 국내 주요 은행 목록
const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "씨티은행", "케이뱅크", "카카오뱅크", "토스뱅크",
  "새마을금고", "신협", "우체국", "수협은행", "대구은행", "부산은행",
  "광주은행", "전북은행", "경남은행", "제주은행", "산업은행",
];

// 계좌번호 형식 검증: 숫자/하이픈만, 숫자 10~16자리
function validateAccountNumber(raw: string): { ok: boolean; cleaned: string; msg?: string } {
  const cleaned = raw.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(cleaned)) {
    return { ok: false, cleaned, msg: "계좌번호는 숫자와 하이픈(-)만 입력하세요." };
  }
  if (cleaned.length < 10 || cleaned.length > 16) {
    return { ok: false, cleaned, msg: "계좌번호 자릿수를 확인해주세요 (10~16자리)." };
  }
  return { ok: true, cleaned };
}

export function RegisterForm({ isSeller }: { isSeller: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const name = fd.get("name") as string;

    // ── 공급자: 계좌번호 형식 검증 ──
    let cleanedAccount = "";
    if (isSeller) {
      const rawAccount = (fd.get("bank_account_number") as string) ?? "";
      const v = validateAccountNumber(rawAccount);
      if (!v.ok) {
        setError(v.msg ?? "계좌번호 형식이 올바르지 않습니다.");
        return;
      }
      cleanedAccount = v.cleaned;
      // ※ 실명검증(예금주 일치)은 PG사 가입 후 이 위치에 API 호출 추가 예정
    }

    setLoading(true);

    const supabase = createClient();
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });

    if (signUpErr || !signUp.user) {
      setError(signUpErr?.message ?? "회원가입에 실패했습니다.");
      setLoading(false); return;
    }

    await supabase.from("profiles").update({ name, phone: fd.get("phone") as string }).eq("id", signUp.user.id);

    if (isSeller) {
      const { error: sellerErr } = await supabase.from("sellers").insert({
        user_id: signUp.user.id,
        business_name: fd.get("business_name") as string,
        representative_name: name,
        contact_phone: fd.get("phone") as string,
        bank_name: fd.get("bank_name") as string,
        bank_account_number: cleanedAccount,
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

          {/* 은행 선택 (드롭다운) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              은행명 <span className="text-destructive">*</span>
            </label>
            <select
              name="bank_name"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
            >
              <option value="">은행을 선택하세요</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <Field
            name="bank_account_number"
            label="계좌번호"
            required
            placeholder="숫자만 입력 (예: 12345678901234)"
            inputMode="numeric"
            hint="숫자와 하이픈(-)만 입력하세요. 입금 확인은 공급자가 직접 진행합니다."
          />
          <Field name="bank_account_holder" label="예금주" required />
          <Field name="usdt_wallet" label="USDT 지갑 주소 (TRC20)" placeholder="T로 시작하는 주소" />
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
  name, label, type = "text", required, minLength, placeholder, inputMode, hint,
}: {
  name: string; label: string; type?: string; required?: boolean;
  minLength?: number; placeholder?: string;
  inputMode?: "numeric" | "text" | "tel" | "email"; hint?: string;
}) {
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
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
