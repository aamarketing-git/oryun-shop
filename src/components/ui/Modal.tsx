"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  primaryLabel = "확인",
  onPrimary,
  secondaryLabel,
  onSecondary,
  variant = "info",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: "info" | "success" | "warn";
}) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // body 스크롤 잠금
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const headerColor =
    variant === "success" ? "#06A776"
    : variant === "warn"  ? "#F59E0B"
    :                       "#3182F6";

  const icon =
    variant === "success" ? "✓"
    : variant === "warn"  ? "!"
    :                       "i";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: 28,
          maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* 아이콘 */}
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: `${headerColor}1A`, color: headerColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, marginBottom: 16,
            margin: "0 auto 16px",
          }}
        >
          {icon}
        </div>

        <h3 style={{
          fontSize: 20, fontWeight: 700, textAlign: "center",
          color: "#191F28", marginBottom: 12,
        }}>{title}</h3>

        <div style={{
          fontSize: 14, color: "#4E5968", textAlign: "center",
          lineHeight: 1.6, marginBottom: 24,
        }}>{children}</div>

        <div style={{ display: "flex", gap: 8 }}>
          {secondaryLabel && (
            <button
              onClick={() => { onSecondary?.(); }}
              style={{
                flex: 1, padding: "12px", borderRadius: 12,
                background: "#F2F4F6", color: "#191F28",
                fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
              }}
            >{secondaryLabel}</button>
          )}
          <button
            onClick={() => { onPrimary ? onPrimary() : onClose(); }}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: headerColor, color: "#fff",
              fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer",
            }}
          >{primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}
