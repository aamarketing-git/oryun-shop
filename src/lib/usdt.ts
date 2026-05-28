import { createServiceClient } from "@/lib/supabase/server";

/**
 * 현재 USDT → KRW 환율 가져오기 (Settings 테이블)
 */
export async function getUsdtKrwRate(): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "usdt_krw_rate")
    .single();
  const v = data?.value as unknown;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return Number(process.env.DEFAULT_USDT_KRW_RATE ?? 1500);
}

/**
 * TronGrid를 통한 TXID 검증 (선택적 자동 검증).
 * 환경변수 TRONGRID_API_KEY가 없으면 수동 검증 모드.
 */
export interface TxVerifyResult {
  ok: boolean;
  fromAddress?: string;
  toAddress?: string;
  amountUsdt?: number;
  blockHeight?: number;
  raw?: unknown;
  reason?: string;
}

export async function verifyTrc20Txid(
  txHash: string,
  expectedToAddress: string,
): Promise<TxVerifyResult> {
  const apiKey = process.env.TRONGRID_API_KEY;
  if (!apiKey) return { ok: false, reason: "MANUAL_VERIFICATION_REQUIRED" };

  try {
    const res = await fetch(
      `https://api.trongrid.io/v1/transactions/${txHash}/events`,
      { headers: { "TRON-PRO-API-KEY": apiKey } },
    );
    if (!res.ok) return { ok: false, reason: "TX_NOT_FOUND" };
    const json = await res.json();

    // USDT TRC20 컨트랙트: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
    const transferEvent = json.data?.find(
      (e: { event_name?: string }) => e.event_name === "Transfer",
    );
    if (!transferEvent) return { ok: false, reason: "NOT_USDT_TRANSFER" };

    const toAddress = transferEvent.result?.to;
    const amount = Number(transferEvent.result?.value ?? 0) / 1_000_000;

    if (toAddress?.toLowerCase() !== expectedToAddress.toLowerCase()) {
      return { ok: false, reason: "WRONG_RECEIVER" };
    }

    return {
      ok: true,
      fromAddress: transferEvent.result?.from,
      toAddress,
      amountUsdt: amount,
      blockHeight: transferEvent.block_number,
      raw: json,
    };
  } catch (e) {
    return { ok: false, reason: `VERIFICATION_ERROR: ${(e as Error).message}` };
  }
}
