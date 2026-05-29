"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { formatKRW, formatUSDT, formatPhoneKR } from "@/lib/utils";
import { CopyText } from "@/components/ui/CopyText";

type PaymentMethod = "bank_transfer" | "usdt";

interface Props {
  productId: string;
  priceKrw: number;
  totalUsdt: number;
  usdtRate: number;
  sellerBank: { name: string; account: string; holder: string };
}

export function CheckoutForm({ productId, priceKrw, totalUsdt, usdtRate, sellerBank }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
  const [phone, setPhone] = useState("");

  const handleSubmit = (formData: FormData) => {
    setError(null);
    formData.set("product_id", productId);
    formData.set("payment_method", payment);

    startTransition(async () => {
      const res = await createOrder(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/account/orders/${res.orderId}`);
    });
  };

  // 계좌번호에서 숫자만 추출 (복사용)
  const cleanAccount = sellerBank.account.replace(/\D/g, "");

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* 오륜 스테이킹 Wallet (필수) */}
      <section className="bg-background border border-border rounded-xl p-6">
        <label htmlFor="staking_wallet" className="block text-sm font-medium mb-2">
          오륜 스테이킹 Wallet 주소 <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          주문 시 반드시 입력해야 합니다. 미입력 시 주문이 처리되지 않습니다.
        </p>
        <input
          id="staking_wallet"
          name="staking_wallet_address"
          type="text"
          required
          placeholder="0x... 또는 T..."
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand"
        />
      </section>

      {/* 배송지 */}
      <section className="bg-background border border-border rounded-xl p-6">
        <h2 className="text-sm font-medium mb-4">배송지</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="recipient" required placeholder="수령인" className="form-input" />
          <input
            name="phone"
            required
            placeholder="연락처 (예: 010-1234-5678)"
            value={phone}
            onChange={(e) => setPhone(formatPhoneKR(e.target.value))}
            inputMode="numeric"
            maxLength={13}
            className="form-input"
          />
          <input name="postal_code" placeholder="우편번호" className="form-input" />
          <input name="address" required placeholder="기본 주소" className="form-input md:col-span-1" />
          <input name="address_detail" placeholder="상세 주소" className="form-input md:col-span-2" />
        </div>
      </section>

      {/* 결제수단 선택 */}
      <section className="bg-background border border-border rounded-xl p-6">
        <h2 className="text-sm font-medium mb-4">결제 방법</h2>
        <div className="grid grid-cols-2 gap-3">
          <PaymentOption
            selected={payment === "bank_transfer"}
            onClick={() => setPayment("bank_transfer")}
            title="계좌이체"
            description="공급자 계좌로 직접 입금"
          />
          <PaymentOption
            selected={payment === "usdt"}
            onClick={() => setPayment("usdt")}
            title="USDT"
            description={`${formatUSDT(totalUsdt)} 송금`}
          />
        </div>

        {/* 안내 박스 */}
        {payment === "bank_transfer" && (
          <div className="mt-6 p-5 bg-muted rounded-xl text-sm space-y-4">
            <p className="font-semibold text-base">공급자 입금 계좌</p>

            <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-200">
              <Row label="은행">
                <span className="font-medium">{sellerBank.name || "—"}</span>
              </Row>
              <Row label="예금주">
                <span className="font-medium">{sellerBank.holder || "—"}</span>
              </Row>
              <Row label="계좌번호">
                {cleanAccount ? (
                  <CopyText
                    value={cleanAccount}
                    display={sellerBank.account}
                    mono
                    label="계좌번호"
                  />
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </Row>
              <Row label="입금 금액">
                <CopyText
                  value={String(priceKrw)}
                  display={formatKRW(priceKrw)}
                  label="입금 금액"
                />
              </Row>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 계좌번호와 금액을 <strong>클릭하면 바로 복사</strong>됩니다.
              주문 완료 후 24시간 이내에 입금해주세요. 공급자가 입금 확인 후 배송이 시작됩니다.
            </p>
          </div>
        )}

        {payment === "usdt" && (
          <div className="mt-6 p-5 bg-muted rounded-xl text-sm space-y-3">
            <p className="font-semibold text-base">USDT 결제 안내</p>
            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
              <Row label="결제 금액">
                <CopyText
                  value={totalUsdt.toFixed(2)}
                  display={formatUSDT(totalUsdt)}
                  label="USDT 금액"
                />
              </Row>
              <Row label="환율">
                <span>1 USDT = {formatKRW(usdtRate)}</span>
              </Row>
            </div>
            <p className="text-xs text-muted-foreground">
              주문 완료 후 송금 주소(TRC20/ERC20/BSC)와 QR이 표시됩니다. 송금 후 TXID를 입력하면 결제가 검증됩니다.
            </p>
          </div>
        )}
      </section>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-apple w-full">
        {pending ? "주문 생성 중..." : "주문하기"}
      </button>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          font-size: 0.875rem;
        }
        .form-input:focus {
          border-color: #3182F6;
          outline: none;
          box-shadow: 0 0 0 1px #3182F6;
        }
      `}</style>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500 text-sm">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function PaymentOption({
  selected, onClick, title, description,
}: { selected: boolean; onClick: () => void; title: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-lg border text-left transition ${
        selected ? "border-applebrand bg-applebrand/5" : "border-border hover:border-foreground/30"
      }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
