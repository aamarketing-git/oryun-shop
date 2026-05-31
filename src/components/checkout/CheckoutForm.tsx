"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrder } from "@/app/actions/orders";
import { formatKRW, formatUSDT, formatPhoneKR } from "@/lib/utils";
import { CopyText } from "@/components/ui/CopyText";
import { Modal } from "@/components/ui/Modal";
import { AddressSearch } from "@/components/checkout/AddressSearch";

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
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

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
      // 주문 완료 모달 표시 (router.push 대신)
      setSuccessOrderId(res.orderId);
    });
  };

  const cleanAccount = sellerBank.account.replace(/\D/g, "");

  return (
    <>
      <form action={handleSubmit} className="space-y-8">
        {/* 오륜 스테이킹 Wallet */}
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
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
          />
        </section>

        {/* 배송지 */}
        <section className="bg-background border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">배송지</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="recipient"
                required
                placeholder="수령인"
                className="px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
              />
              <input
                name="phone"
                required
                placeholder="연락처 (010-1234-5678)"
                value={phone}
                onChange={(e) => setPhone(formatPhoneKR(e.target.value))}
                inputMode="numeric"
                maxLength={13}
                className="px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
              />
            </div>

            {/* 주소 검색 컴포넌트 */}
            <AddressSearch />
          </div>
        </section>

        {/* 결제 방법 */}
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
                    <CopyText value={cleanAccount} display={sellerBank.account} mono label="계좌번호" />
                  ) : <span className="text-gray-400">—</span>}
                </Row>
                <Row label="입금 금액">
                  <CopyText value={String(priceKrw)} display={formatKRW(priceKrw)} label="입금 금액" />
                </Row>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 계좌번호와 금액을 <strong>클릭하면 바로 복사</strong>됩니다.
              </p>
            </div>
          )}

          {payment === "usdt" && (
            <div className="mt-6 p-5 bg-muted rounded-xl text-sm space-y-3">
              <p className="font-semibold text-base">USDT 결제 안내</p>
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
                <Row label="결제 금액">
                  <CopyText value={totalUsdt.toFixed(2)} display={formatUSDT(totalUsdt)} label="USDT 금액" />
                </Row>
                <Row label="환율">
                  <span>1 USDT = {formatKRW(usdtRate)}</span>
                </Row>
              </div>
              <p className="text-xs text-muted-foreground">
                주문 완료 후 송금 주소와 QR이 표시됩니다.
              </p>
            </div>
          )}
        </section>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[14px] bg-[#3182F6] text-white font-semibold py-3.5 disabled:opacity-50 hover:bg-[#1B64DA] transition"
        >
          {pending ? "주문 처리 중..." : "주문하기"}
        </button>
      </form>

      {/* 주문 완료 모달 */}
      <Modal
        open={!!successOrderId}
        onClose={() => {}}
        title="주문이 완료되었습니다"
        variant="success"
        primaryLabel="주문 내역 확인"
        onPrimary={() => {
          if (successOrderId) {
            router.push(`/account/orders/${successOrderId}`);
          }
        }}
        secondaryLabel="새 주문하기"
        onSecondary={() => {
          setSuccessOrderId(null);
          router.push("/");
        }}
      >
        <div className="text-left space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
            <p className="font-semibold mb-1">⏰ 24시간 이내에 입금을 완료해주세요</p>
            <p className="text-xs">입금이 확인되지 않으면 주문이 자동 취소될 수 있습니다.</p>
          </div>
          <div className="text-sm space-y-1.5 px-1">
            <div className="flex justify-between">
              <span className="text-gray-500">결제 방법</span>
              <span className="font-medium">
                {payment === "bank_transfer" ? "계좌이체" : "USDT"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 금액</span>
              <span className="font-medium">
                {payment === "bank_transfer" ? formatKRW(priceKrw) : formatUSDT(totalUsdt)}
              </span>
            </div>
            {payment === "bank_transfer" && cleanAccount && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">입금 계좌</span>
                  <span className="font-medium">{sellerBank.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">예금주</span>
                  <span className="font-medium">{sellerBank.holder}</span>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            "주문 내역 확인"을 누르면 상세 정보와 입금 안내를 보실 수 있어요.
          </p>
        </div>
      </Modal>
    </>
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
        selected
          ? "border-[#3182F6] bg-[#E8F1FE]"
          : "border-border hover:border-gray-400"
      }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
