import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(amount: number | bigint): string {
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(Number(amount)) + "원";
}

export function formatUSDT(amount: number): string {
  return `${amount.toFixed(2)} USDT`;
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

/** USDT TXID 형식 기본 검증 (TRC20: 64-hex / ERC20: 0x + 64-hex) */
export function isValidTxHash(hash: string, chain: "TRC20" | "ERC20" = "TRC20"): boolean {
  const trimmed = hash.trim();
  if (chain === "ERC20") return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
  return /^[a-fA-F0-9]{64}$/.test(trimmed);
}

/** 한국 휴대전화 정규화 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
