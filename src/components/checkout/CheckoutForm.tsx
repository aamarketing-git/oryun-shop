"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder, submitTxid } from "@/app/actions/orders";
import { formatKRW, formatUSDT, formatPhoneKR } from "@/lib/utils";
import { CopyText } from "@/components/ui/CopyText";
import { Modal } from "@/components/ui/Modal";
import { AddressSearch } from "@/components/checkout/AddressSearch";

type PaymentMethod = "bank_transfer" | "usdt";

interface SellerUsdt {
  trc20?: string | null;
  erc20?: string | null;
  bsc?: string | null;
}

interface Props {
  productId: string;
  priceKrw: number;
  totalUsdt: number;
  usdtRate: number;
  sellerBank: { name: string; account: string; holder: string };
  sellerUsdt?: SellerUsdt;
}

export function CheckoutForm({
  productId,
  priceKrw,
  totalUsdt,
  usdtRate,
  sellerBank,
  sellerUsdt,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("bank_transfer");
  const [phone, setPhone] = useState("");
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // TXID 제출 상태 (USDT 주문 완료 모달용)
  const [txidInput, setTxidInput] = useState("");
  const [txidChain, setTxidChain] = useState<"TRC20" | "ERC20">("TRC20");
  const [txidLoading, setTxidLoading] = useState(false);
  const [txidError, setTxidError] = useState<string | null>(null);
  const [txidSubmitted, setTxidSubmitted] = useState(false);

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
      setSuccessOrderId(res.orderId);
    });
  };

  const cleanAccount = sellerBank.account.replace(/\D/g, "");

  // USDT 주소가 등록된 것만 보여줌
  const usdtWallets = [
    { chain: "TRC20 (Tron)",  addr: sellerUsdt?.trc20 },
    { chain: "ERC20 (Ethereum)", addr: sellerUsdt?.erc20 },
    { chain: "BSC / BEP-20",  addr: sellerUsdt?.bsc },
  ].filter((w) => w.addr && w.addr.trim().length > 0);

  return (
    <>
      <form action={handleSubmit} className="space-y-8">
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

          {/* 계좌이체 — 공급자 계좌 정보 */}
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

          {/* USDT — 공급자 지갑 + 스테이킹 지갑 */}
          {payment === "usdt" && (
            <div className="mt-6 p-5 bg-muted rounded-xl text-sm space-y-4">
              <div>
                <p className="font-semibold text-base mb-3">USDT 결제 금액</p>
                <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
                  <Row label="결제 금액">
                    <CopyText value={totalUsdt.toFixed(2)} display={formatUSDT(totalUsdt)} label="USDT 금액" />
                  </Row>
                  <Row label="환율">
                    <span>1 USDT = {formatKRW(usdtRate)}</span>
                  </Row>
                </div>
              </div>

              {usdtWallets.length > 0 ? (
                <div>
                  <p className="font-semibold text-base mb-3">공급자 USDT 받는 주소</p>
                  <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
                    {usdtWallets.map((w) => (
                      <div key={w.chain}>
                        <p className="text-xs text-gray-500 mb-1">{w.chain}</p>
                        <CopyText
                          value={w.addr!}
                          display={w.addr!}
                          mono
                          label={`${w.chain} 주소`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    💡 주소를 <strong>클릭하면 바로 복사</strong>됩니다. 본인 지갑이 지원하는 체인을 선택해 송금하세요.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  ⚠️ 이 공급자는 USDT 받는 주소를 아직 등록하지 않았습니다. 계좌이체를 이용해주세요.
                </div>
              )}
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

      {/* 주문 완료 모달 
          - 계좌이체: "확인" 한 개 → 홈으로
          - USDT: "주문 내역 확인" + "홈으로" 두 개 (TXID 제출 필요해서)
      */}
      <Modal
        open={!!successOrderId}
        onClose={() => {}}
        title={
          payment === "bank_transfer"
            ? "주문이 접수되었습니다"
            : (txidSubmitted ? "주문이 완료되었습니다" : "송금 후 TXID를 입력해주세요")
        }
        variant="success"
        primaryLabel={
          payment === "bank_transfer"
            ? "확인"
            : (txidSubmitted ? "주문 내역 확인" : (txidLoading ? "제출 중..." : "TXID 제출"))
        }
        onPrimary={async () => {
          // 계좌이체: 확인 → 홈으로
          if (payment === "bank_transfer") {
            setSuccessOrderId(null);
            router.push("/");
            return;
          }
          // USDT — 제출 완료 후엔 주문 내역으로
          if (txidSubmitted && successOrderId) {
            router.push(`/account/orders/${successOrderId}`);
            return;
          }
          // USDT — TXID 제출 처리
          if (!successOrderId) return;
          setTxidError(null);
          if (!txidInput.trim()) {
            setTxidError("TXID를 입력해주세요.");
            return;
          }
          setTxidLoading(true);
          const res = await submitTxid({
            orderId: successOrderId,
            txHash: txidInput.trim(),
            chain: txidChain,
          });
          setTxidLoading(false);
          if (res?.error) {
            setTxidError(res.error);
            return;
          }
          setTxidSubmitted(true);
        }}
        secondaryLabel={
          payment === "usdt"
            ? (txidSubmitted ? "홈으로" : "나중에 입력")
            : undefined
        }
        onSecondary={
          payment === "usdt"
            ? () => {
                setSuccessOrderId(null);
                if (txidSubmitted) {
                  router.push("/");
                } else if (successOrderId) {
                  // 나중에 입력 — 주문 내역 페이지로 (거기서도 TXID 제출 가능)
                  router.push(`/account/orders/${successOrderId}`);
                }
              }
            : undefined
        }
      >
        <div className="text-left space-y-3">
          {/* 계좌이체 — 24시간 안내 */}
          {payment === "bank_transfer" && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
                <p className="font-semibold mb-1">⏰ 24시간 이내에 입금을 완료해주세요</p>
                <p className="text-xs">입금이 확인되지 않으면 주문이 자동 취소될 수 있습니다.</p>
              </div>
              <div className="text-sm space-y-1.5 px-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">결제 금액</span>
                  <span className="font-medium">{formatKRW(priceKrw)}</span>
                </div>
                {cleanAccount && (
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
            </>
          )}

          {/* USDT — TXID 입력 폼 (미제출 시) */}
          {payment === "usdt" && !txidSubmitted && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                <p className="font-semibold mb-1">📌 송금 후 TXID 입력</p>
                <p className="text-xs">
                  공급자 USDT 주소로 <strong>{formatUSDT(totalUsdt)}</strong>을 송금한 뒤,
                  거래 영수증의 <strong>TXID(트랜잭션 해시)</strong>를 아래에 입력하세요.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">
                  체인 선택
                </label>
                <div className="flex gap-2">
                  {(["TRC20", "ERC20"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTxidChain(c)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        txidChain === c
                          ? "bg-[#3182F6] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">
                  TXID (트랜잭션 해시)
                </label>
                <input
                  type="text"
                  value={txidInput}
                  onChange={(e) => setTxidInput(e.target.value)}
                  placeholder={txidChain === "TRC20" ? "TRC20 트랜잭션 해시" : "0x로 시작하는 해시"}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-mono focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
                />
              </div>

              {txidError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                  {txidError}
                </div>
              )}

              <p className="text-xs text-gray-500">
                💡 아직 송금 전이면 "나중에 입력" 버튼을 눌러주세요. 주문 내역 페이지에서도 입력할 수 있어요.
              </p>
            </>
          )}

          {/* USDT — TXID 제출 완료 */}
          {payment === "usdt" && txidSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold mb-1">✓ TXID 제출 완료</p>
              <p className="text-xs">
                관리자가 송금 내역을 확인한 후 결제 완료 처리됩니다.
                보통 30분~수 시간 이내에 처리돼요.
              </p>
            </div>
          )}
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
