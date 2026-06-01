"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneKR, isValidPhoneKR, validatePassword } from "@/lib/utils";

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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [existingSeller, setExistingSeller] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  // 로그인 상태 + 기존 sellers 행 확인 + 관리자 차단
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isSeller) {
        // 관리자 차단 — 공급자 신청 자체가 불가능
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, phone")
          .eq("id", user.id)
          .single();
        if (profile?.role === "admin") {
          setIsAdmin(true);
          setCheckingAuth(false);
          return;
        }

        setCurrentUser({ id: user.id, email: user.email ?? "" });
        // 이미 공급자 신청한 적 있는지 확인
        const { data: existing } = await supabase
          .from("sellers")
          .select("status")
          .eq("user_id", user.id)
          .single();
        if (existing) {
          setExistingSeller(true);
          // 이미 공급자면 대기 페이지로 보내기
          router.push("/seller/pending");
          return;
        }
        // 프로필에서 전화번호 자동 입력
        if (profile?.phone) setPhone(formatPhoneKR(profile.phone));
      }
      setCheckingAuth(false);
    };
    check();
  }, [isSeller, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // 전화번호 검증
    if (!isValidPhoneKR(phone)) {
      setError("올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)");
      return;
    }

    const fd = new FormData(e.currentTarget);

    // 공급자: 계좌번호 검증
    let cleanedAccount = "";
    if (isSeller) {
      const rawAccount = (fd.get("bank_account_number") as string) ?? "";
      const v = validateAccountNumber(rawAccount);
      if (!v.ok) {
        setError(v.msg ?? "계좌번호 형식이 올바르지 않습니다.");
        return;
      }
      cleanedAccount = v.cleaned;
    }

    setLoading(true);
    const supabase = createClient();

    let userId: string;

    // 📌 분기: 이미 로그인했으면 → 회원가입 스킵하고 sellers만 insert
    if (currentUser && isSeller) {
      userId = currentUser.id;
      // 전화번호만 프로필에 업데이트
      await supabase.from("profiles").update({ phone }).eq("id", userId);
    } else {
      // 일반 신규 회원가입 흐름
      const email = fd.get("email") as string;
      const password = fd.get("password") as string;
      const name = fd.get("name") as string;

      // 비밀번호 강도 검증 (영문+숫자+특수문자, 8자 이상)
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) {
        setError(pwCheck.msg ?? "비밀번호가 안전하지 않습니다.");
        setLoading(false);
        return;
      }

      const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
        email, password, options: { data: { name } },
      });
      if (signUpErr || !signUp.user) {
        const raw = signUpErr?.message ?? "";
        let friendly = "회원가입에 실패했습니다.";
        if (raw.includes("already registered") || raw.includes("already been registered")) {
          friendly = isSeller
            ? "이미 가입된 이메일입니다. 먼저 로그인하시면 자동으로 공급자 신청 화면이 이어집니다."
            : "이미 가입된 이메일입니다. 로그인해주세요.";
        } else if (raw.includes("Password")) {
          friendly = "비밀번호는 8자 이상 입력해주세요.";
        } else if (raw.includes("Invalid email")) {
          friendly = "올바른 이메일 형식이 아닙니다.";
        } else if (raw) {
          friendly = "회원가입 실패: " + raw;
        }
        setError(friendly);
        setLoading(false);
        return;
      }
      userId = signUp.user.id;
      await supabase.from("profiles").update({ name, phone }).eq("id", userId);
    }

    // 공급자 정보 저장
    if (isSeller) {
      const { error: sellerErr } = await supabase.from("sellers").insert({
        user_id: userId,
        business_name: fd.get("business_name") as string,
        representative_name: fd.get("representative_name") as string || currentUser?.email?.split("@")[0] || "대표",
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
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push(isSeller ? "/seller/pending" : (nextPath ?? "/"));
    router.refresh();
  }

  // 인증 확인 중
  if (checkingAuth) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">확인 중...</div>
    );
  }

  // 관리자는 공급자 신청 불가
  if (isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="inline-block rounded-2xl border border-amber-200 bg-amber-50 p-6 max-w-sm">
          <p className="text-2xl mb-3">⚠️</p>
          <p className="text-base font-semibold text-amber-900 mb-2">관리자는 공급자로 신청할 수 없어요</p>
          <p className="text-sm text-amber-800 mb-4">
            관리자 계정과 공급자 계정은 분리되어야 합니다.
            <br />공급자 활동이 필요하시면 별도 이메일로 가입해주세요.
          </p>
          <Link
            href="/admin/dashboard"
            className="inline-block rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#1B64DA] transition"
          >
            관리자 대시보드로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 이미 공급자 신청한 경우 (위 useEffect에서 리다이렉트되지만 안전망)
  if (existingSeller) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-600 mb-4">이미 공급자로 등록되어 있어요.</p>
        <Link href="/seller/pending" className="text-blue-600 underline">상태 확인하기</Link>
      </div>
    );
  }

  // 이미 로그인한 사용자가 공급자 신청하는 경우
  const isExistingUserBecomingSeller = currentUser && isSeller;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isExistingUserBecomingSeller && (
        <div className="rounded-xl bg-[#E8F1FE] border border-[#C7DCFC] p-4 mb-4 text-sm text-[#1B64DA]">
          <p className="font-semibold mb-1">✓ 로그인 상태에서 공급자 신청 중이에요</p>
          <p>계정: <strong>{currentUser.email}</strong></p>
          <p className="text-xs mt-1">아래 사업자 정보만 입력하시면 됩니다 (이메일/비밀번호 다시 입력 X)</p>
        </div>
      )}

      {/* 신규 가입 사용자만 이메일/비밀번호/이름 입력 */}
      {!isExistingUserBecomingSeller && (
        <>
          <Field name="email" type="email" label="이메일" required />
          <PasswordField />
          <Field name="name" label={isSeller ? "대표자 이름" : "이름"} required />
        </>
      )}

      {/* 전화번호: 자동 포맷 (로그인 사용자도 입력/수정) */}
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
          {isExistingUserBecomingSeller && (
            <Field name="representative_name" label="대표자 이름" required />
          )}

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
            hint="숫자와 하이픈(-)만 입력하세요."
          />
          <Field name="bank_account_holder" label="예금주" required />

          <hr className="my-4 border-border" />
          <p className="text-sm font-medium">USDT 지갑 주소 (선택 — 각 체인별 입력)</p>
          <Field name="usdt_wallet_trc20" label="USDT (TRC20)" placeholder="T로 시작" mono />
          <Field name="usdt_wallet_erc20" label="USDT (ERC20)" placeholder="0x로 시작 (Ethereum)" mono />
          <Field name="usdt_wallet_bsc"   label="USDT (BSC / BEP-20)" placeholder="0x로 시작 (BNB Smart Chain)" mono />
        </>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
          {error.includes("이미 가입된") && (
            <p className="text-xs text-red-600 mt-2">
              👉 <Link href="/auth/login?next=/auth/register?role=seller" className="underline font-semibold">로그인하러 가기</Link>
            </p>
          )}
        </div>
      )}

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

function PasswordField() {
  const [pw, setPw] = useState("");
  // 실시간 강도 체크
  const hasLen = pw.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pw);
  const passCount = [hasLen, hasLetter, hasDigit, hasSpecial].filter(Boolean).length;

  const strengthLabel =
    passCount === 4 ? "안전" : passCount >= 2 ? "보통" : "약함";
  const strengthColor =
    passCount === 4 ? "#06A776" : passCount >= 2 ? "#F59E0B" : "#EF4444";

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        비밀번호 <span className="text-destructive">*</span>
      </label>
      <input
        name="password"
        type="password"
        required
        minLength={8}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="영문 + 숫자 + 특수문자 포함, 8자 이상"
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
      />
      {pw && (
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${(passCount / 4) * 100}%`,
                  background: strengthColor,
                  transition: "all 0.2s",
                }}
                className="h-full"
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: strengthColor }}>
              {strengthLabel}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
            <span style={{ color: hasLen ? "#06A776" : "#9ca3af" }}>
              {hasLen ? "✓" : "○"} 8자 이상
            </span>
            <span style={{ color: hasLetter ? "#06A776" : "#9ca3af" }}>
              {hasLetter ? "✓" : "○"} 영문
            </span>
            <span style={{ color: hasDigit ? "#06A776" : "#9ca3af" }}>
              {hasDigit ? "✓" : "○"} 숫자
            </span>
            <span style={{ color: hasSpecial ? "#06A776" : "#9ca3af" }}>
              {hasSpecial ? "✓" : "○"} 특수문자
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
