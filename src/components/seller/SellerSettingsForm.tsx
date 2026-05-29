"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSellerProfile } from "@/app/actions/seller-profile";
import { formatPhoneKR, isValidPhoneKR } from "@/lib/utils";

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "씨티은행", "케이뱅크", "카카오뱅크", "토스뱅크",
  "새마을금고", "신협", "우체국", "수협은행", "대구은행", "부산은행",
  "광주은행", "전북은행", "경남은행", "제주은행", "산업은행",
];

type Seller = {
  business_name: string | null;
  representative_name: string | null;
  contact_phone: string | null;
  contact_kakao: string | null;
  contact_telegram: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  usdt_wallet_trc20: string | null;
  usdt_wallet_erc20: string | null;
  usdt_wallet_bsc: string | null;
};

export function SellerSettingsForm({ seller }: { seller: Seller }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [phone, setPhone] = useState(formatPhoneKR(seller.contact_phone ?? ""));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    // 전화번호 검증
    if (phone && !isValidPhoneKR(phone)) {
      setMessage({ type: "err", text: "연락처 형식이 올바르지 않습니다 (예: 010-1234-5678)" });
      return;
    }

    setSaving(true);
    const fd = new FormData(e.currentTarget);

    // 계좌번호 형식 검증
    const rawAccount = (fd.get("bank_account_number") as string)?.trim() ?? "";
    const cleaned = rawAccount.replace(/[\s-]/g, "");
    if (rawAccount && (!/^\d+$/.test(cleaned) || cleaned.length < 10 || cleaned.length > 16)) {
      setMessage({ type: "err", text: "계좌번호는 숫자 10~16자리로 입력하세요." });
      setSaving(false);
      return;
    }

    const result = await updateSellerProfile({
      business_name: (fd.get("business_name") as string)?.trim(),
      representative_name: (fd.get("representative_name") as string)?.trim(),
      contact_phone: phone,
      contact_kakao: ((fd.get("contact_kakao") as string)?.trim()) || null,
      contact_telegram: ((fd.get("contact_telegram") as string)?.trim()) || null,
      bank_name: (fd.get("bank_name") as string)?.trim() || null,
      bank_account_number: cleaned || null,
      bank_account_holder: ((fd.get("bank_account_holder") as string)?.trim()) || null,
      usdt_wallet_trc20: ((fd.get("usdt_wallet_trc20") as string)?.trim()) || null,
      usdt_wallet_erc20: ((fd.get("usdt_wallet_erc20") as string)?.trim()) || null,
      usdt_wallet_bsc:   ((fd.get("usdt_wallet_bsc")   as string)?.trim()) || null,
    });

    setSaving(false);

    if (result.error) {
      setMessage({ type: "err", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: "저장되었습니다." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 사업자 정보 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-4">사업자 정보</h2>
        <div className="space-y-4">
          <Field name="business_name" label="상호명" defaultValue={seller.business_name ?? ""} required />
          <Field name="representative_name" label="대표자명" defaultValue={seller.representative_name ?? ""} required />

          {/* 전화번호 자동 포맷 */}
          <div>
            <Label>연락처 <span className="text-red-500">*</span></Label>
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhoneKR(e.target.value))}
              placeholder="010-1234-5678"
              inputMode="numeric"
              maxLength={13}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* 정산 정보 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-4">정산 정보</h2>
        <div className="space-y-4">
          <div>
            <Label>은행</Label>
            <select
              name="bank_name"
              defaultValue={seller.bank_name ?? ""}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">은행을 선택하세요</option>
              {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <Field
            name="bank_account_number"
            label="계좌번호"
            defaultValue={seller.bank_account_number ?? ""}
            placeholder="숫자 10~16자리"
            inputMode="numeric"
            hint="숫자와 하이픈(-)만 입력하세요."
          />
          <Field name="bank_account_holder" label="예금주" defaultValue={seller.bank_account_holder ?? ""} />

          <hr className="my-2" />
          <p className="text-sm font-medium text-gray-700">USDT 지갑 주소 (각 체인별)</p>

          <Field name="usdt_wallet_trc20" label="USDT (TRC20)" defaultValue={seller.usdt_wallet_trc20 ?? ""} placeholder="T로 시작" mono />
          <Field name="usdt_wallet_erc20" label="USDT (ERC20)" defaultValue={seller.usdt_wallet_erc20 ?? ""} placeholder="0x로 시작 (Ethereum)" mono />
          <Field name="usdt_wallet_bsc"   label="USDT (BSC / BEP-20)" defaultValue={seller.usdt_wallet_bsc ?? ""} placeholder="0x로 시작 (BNB Smart Chain)" mono />
        </div>
      </section>

      {/* 문의 채널 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold mb-4">고객 문의 채널</h2>
        <p className="text-xs text-gray-500 mb-4">
          상품 상세 페이지에 표시되어 고객이 직접 문의할 수 있습니다.
        </p>
        <div className="space-y-4">
          <Field name="contact_kakao" label="카카오톡 오픈채팅 / ID" defaultValue={seller.contact_kakao ?? ""} placeholder="예: https://open.kakao.com/o/..." />
          <Field name="contact_telegram" label="텔레그램" defaultValue={seller.contact_telegram ?? ""} placeholder="예: @username" />
        </div>
      </section>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === "ok"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-[14px] bg-[#3182F6] text-white font-semibold py-3.5 disabled:opacity-50 hover:bg-[#1B64DA] transition"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1 text-gray-700">{children}</label>;
}

function Field({
  name, label, defaultValue, required, placeholder, inputMode, hint, mono,
}: {
  name: string; label: string; defaultValue?: string; required?: boolean;
  placeholder?: string; inputMode?: "numeric" | "text" | "tel" | "email";
  hint?: string; mono?: boolean;
}) {
  return (
    <div>
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
          mono ? "font-mono" : ""
        }`}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
