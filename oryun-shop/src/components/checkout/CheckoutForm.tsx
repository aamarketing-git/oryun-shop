"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { formatKRW, formatUSDT } from "@/lib/utils";

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
          <input name="phone" required placeholder="연락처" className="form-input" />
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
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">공급자 입금 계좌</p>
            <p className="text-muted-foreground">
              {sellerBank.name} / {sellerBank.account}
              <br />
              예금주: {sellerBank.holder}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              주문 완료 후 24시간 이내에 위 계좌로 <strong>{formatKRW(priceKrw)}</strong>을 입금해주세요.
              공급자가 입금 확인 후 배송이 시작됩니다.
            </p>
          </div>
        )}

        {payment === "usdt" && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">USDT 결제 안내</p>
            <p className="text-muted-foreground">
              결제 금액: <strong>{formatUSDT(totalUsdt)}</strong>
              <br />
              환율: 1 USDT = {formatKRW(usdtRate)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              주문 완료 후 송금 주소와 QR이 표시됩니다. 송금 후 TXID를 입력하면 결제가 검증됩니다.
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
