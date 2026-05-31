"use client";

import { useState } from "react";

/**
 * 클릭하면 자동으로 클립보드에 복사되는 텍스트.
 * 계좌번호·지갑주소·금액 등 빠르게 복사할 정보에 사용.
 *
 * @param value  복사될 실제 값 (예: 숫자만 정제된 계좌번호)
 * @param display  표시될 텍스트 (없으면 value 그대로)
 * @param mono  monospace 글꼴 (계좌·지갑 주소에 적합)
 * @param label  스크린리더용 라벨 (선택)
 */
export function CopyText({
  value,
  display,
  mono = false,
  label,
  className = "",
}: {
  value: string;
  display?: string;
  mono?: boolean;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 미지원 환경 무시
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ? `${label} 복사하기` : "복사하기"}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition
        ${copied
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-white border border-gray-200 hover:border-[#3182F6] hover:bg-blue-50 text-gray-900"}
        ${mono ? "font-mono break-all" : ""}
        ${className}`}
      title={copied ? "복사되었습니다" : "클릭하면 복사됩니다"}
    >
      <span>{display ?? value}</span>
      <span className="text-xs flex-shrink-0">
        {copied ? "✓ 복사됨" : "📋"}
      </span>
    </button>
  );
}
