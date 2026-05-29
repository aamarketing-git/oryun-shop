"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, ChevronRight, Laptop, Coins, Shirt, Headphones, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";

const CATEGORIES = [
  { href: "/products?category=digital", label: "디지털", icon: Laptop },
  { href: "/products?category=staking", label: "스테이킹", icon: Coins },
  { href: "/products?category=lifestyle", label: "라이프", icon: Shirt },
  { href: "/products?category=accessories", label: "액세서리", icon: Headphones },
];

export function MenuDrawer({
  isLoggedIn,
  accountHref,
  userRole,
}: {
  isLoggedIn: boolean;
  accountHref: string;
  userRole?: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuLinks = isLoggedIn
    ? [
        { href: "/account/orders", label: "내 주문" },
        { href: "/account", label: "내 정보" },
        ...(userRole === "admin" ? [{ href: "/admin/dashboard", label: "관리자 페이지" }] : []),
        ...(userRole === "seller" ? [{ href: "/seller/dashboard", label: "공급자 페이지" }] : []),
      ]
    : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="전체 메뉴"
        className="opacity-80 hover:opacity-100 transition"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)" }}
          aria-hidden="true"
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          width: "min(440px, 100vw)",
          maxWidth: "100vw",
          background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
          overflow: "hidden",
        }}
        aria-hidden={!open}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E5E8EB",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "#191F28" }}>
            전체 메뉴
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="닫기"
            style={{ padding: 8, margin: -8, background: "none", border: "none", cursor: "pointer" }}
          >
            <X className="h-6 w-6" style={{ color: "#8B95A1" }} />
          </button>
        </div>

        {/* 본문 — 전체가 함께 스크롤되는 단일 영역 (카테고리 박스에 별도 높이 제한 없음) */}
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "20px", minHeight: 0 }}>
          {/* 카테고리 제목 */}
          <p style={{ fontSize: 13, fontWeight: 600, color: "#8B95A1", margin: "0 0 12px" }}>
            카테고리
          </p>

          {/* 카테고리 목록 — 세로로 쫙 펼침 (한눈에 4개 다 보임) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    borderRadius: 14,
                    background: "#F2F4F6",
                    padding: "18px 18px",
                    textDecoration: "none",
                    color: "#191F28",
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#3182F6", flexShrink: 0 }} />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{c.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 메뉴 (로그인 시) */}
          {isLoggedIn && menuLinks.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#8B95A1", margin: "0 0 12px" }}>
                메뉴
              </p>
              <div>
                {menuLinks.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 4px",
                      borderBottom: "1px solid #F2F4F6",
                      fontSize: 16,
                      textDecoration: "none",
                      color: "#191F28",
                    }}
                  >
                    <span>{m.label}</span>
                    <ChevronRight className="h-4 w-4" style={{ color: "#D1D6DB" }} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 고정 버튼 */}
        <div
          style={{
            flexShrink: 0,
            padding: "16px 20px",
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            borderTop: "1px solid #E5E8EB",
            background: "#fff",
          }}
        >
          {isLoggedIn ? (
            <form action={signOut}>
              <button
                type="submit"
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 14,
                  border: "1px solid #E5E8EB",
                  background: "#F2F4F6",
                  padding: "14px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#191F28",
                  cursor: "pointer",
                }}
              >
                <LogOut className="h-[18px] w-[18px]" />
                로그아웃
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                background: "#3182F6",
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              로그인 / 회원가입
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
