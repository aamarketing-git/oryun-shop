"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneKR, isValidPhoneKR } from "@/lib/utils";

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "씨티은행", "케이뱅크", "카카오뱅크", "토스뱅크",
  "새마을금고", "신협", "우체국", "수협은행", "대구은행", "부산은행",
  "광주은행", "전북은행", "경남은행", "제주은행", "산업은행",
];

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

export function RegisterForm({ isSeller, nextPath }: { isSeller: boolean; nextPath?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // 전화번호 자릿수 검증
    if (!isValidPhoneKR(phone)) {
      setError("올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const name = fd.get("name") as string;

    // 공급자: 계좌번호 형식 검증
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
      // Supabase 에러 메시지를 한국어로 변환
      const raw = signUpErr?.message ?? "";
      let friendly = "회원가입에 실패했습니다.";
      if (raw.includes("already registered") || raw.includes("already been registered")) {
        friendly = isSeller
          ? "이미 가입된 이메일입니다. 로그인 후 공급자 신청을 진행해주세요."
          : "이미 가입된 이메일입니다. 로그인해주세요.";
      } else if (raw.includes("Password")) {
        friendly = "비밀번호가 너무 짧거나 약합니다. 8자 이상으로 입력해주세요.";
      } else if (raw.includes("Invalid email")) {
        friendly = "올바른 이메일 형식이 아닙니다.";
      } else if (raw) {
        friendly = "회원가입에 실패했습니다: " + raw;
      }
      setError(friendly);
      setLoading(false); return;
    }

    await supabase.from("profiles").update({ name, phone }).eq("id", signUp.user.id);

    if (isSeller) {
      const { error: sellerErr } = await supabase.from("sellers").insert({
        user_id: signUp.user.id,
        business_name: fd.get("business_name") as string,
        representative_name: name,
        contact_phone: phone,
        bank_name: fd.get("bank_name") as string,
        bank_account_number: cleanedAccount,
        bank_account_holder: fd.get("bank_account_holder") as string,
        usdt_wallet_trc20: ((fd.get("usdt_wallet_trc20") as string) ?? "").trim() || null,
        usdt_wallet_erc20: ((fd.get("usdt_wallet_erc20") as string) ?? "").trim() || null,
        usdt_wallet_bsc:   ((fd.get("usdt_wallet_bsc")   as string) ?? "").trim() || null,
        status: "pending",
      });
      if (sellerErr) {
        setError("공급자 정보 저장 실패: " + sellerErr.message);
        setLoading(false); return;
      }
    }

    setLoading(false);
    router.push(isSeller ? "/seller/pending" : (nextPath ?? "/"));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field name="email" type="email" label="이메일" required />
      <Field name="password" type="password" label="비밀번호" required minLength={8} />
      <Field name="name" label={isSeller ? "대표자 이름" : "이름"} required />

      {/* 전화번호: 자동 포맷 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          연락처 <span className="text-destructive">*</span>
        </label>
        <input
          name="phone_display"
          value={phone}
          onChange={(e) => setPhone(formatPhoneKR(e.target.value))}
          placeholder="010-1234-5678"
          inputMode="numeric"
          maxLength={13}
          required
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
        />
      </div>

      {isSeller && (
        <>
          <hr className="my-6 border-border" />
          <h3 className="text-sm font-medium">공급자 정보</h3>
          <Field name="business_name" label="상호명" required />

          {/* 은행 드롭다운 */}
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
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
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

          <hr className="my-4 border-border" />
          <p className="text-sm font-medium">USDT 지갑 주소 (선택 — 각 체인별 입력)</p>
          <Field name="usdt_wallet_trc20" label="USDT (TRC20)" placeholder="T로 시작" mono />
          <Field name="usdt_wallet_erc20" label="USDT (ERC20)" placeholder="0x로 시작 (Ethereum)" mono />
          <Field name="usdt_wallet_bsc"   label="USDT (BSC / BEP-20)" placeholder="0x로 시작 (BNB Smart Chain)" mono />
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
  name, label, type = "text", required, minLength, placeholder, inputMode, hint, mono,
}: {
  name: string; label: string; type?: string; required?: boolean;
  minLength?: number; placeholder?: string;
  inputMode?: "numeric" | "text" | "tel" | "email"; hint?: string; mono?: boolean;
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
        className={`w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand ${mono ? "font-mono" : ""}`}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
