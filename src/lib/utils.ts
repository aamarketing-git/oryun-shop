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
export function isValidTxHash(hash: string, chain: "TRC20" | "ERC20" | "BSC" = "TRC20"): boolean {
  const trimmed = hash.trim();
  // ERC20과 BSC 모두 EVM 체인 — 0x로 시작, 64자리 hex
  if (chain === "ERC20" || chain === "BSC") return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
  return /^[a-fA-F0-9]{64}$/.test(trimmed);
}

/** 한국 휴대전화 정규화 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * 전화번호 자동 포맷 (한국 형식)
 * "01012345678" → "010-1234-5678"
 * "0212345678"  → "02-1234-5678"
 * "021234567"   → "02-123-4567"
 */
export function formatPhoneKR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  // 서울 02 (2자리 지역번호)
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  // 휴대폰/3자리 지역번호 (010, 02 제외)
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * 한국 전화번호 형식 검증 (자릿수만)
 * 09 이상이면서 9~11자리 숫자
 */
export function isValidPhoneKR(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11 && /^0\d+$/.test(digits);
}
