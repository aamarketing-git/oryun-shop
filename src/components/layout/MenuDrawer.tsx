"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { href: "/products?category=digital", label: "디지털" },
  { href: "/products?category=staking", label: "스테이킹" },
  { href: "/products?category=lifestyle", label: "라이프" },
  { href: "/products?category=accessories", label: "액세서리" },
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
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

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
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, lineHeight: 1 }}
      >
        ☰
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)" }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          zIndex: 201,
          width: "min(440px, 100vw)",
          background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
          overflowY: "auto",
          padding: "0 0 40px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E5E8EB",
            position: "sticky",
            top: 0,
            background: "#fff",
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, color: "#191F28" }}>전체 메뉴</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="닫기"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#8B95A1" }}
          >
            ✕
          </button>
        </div>

        {/* 카테고리 */}
        <div style={{ padding: "20px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#8B95A1", margin: "0 0 12px" }}>카테고리</p>

          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                borderRadius: 14,
                background: "#F2F4F6",
                padding: "18px 18px",
                marginBottom: 10,
                textDecoration: "none",
                color: "#191F28",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {c.label}
            </Link>
          ))}

          {/* 메뉴 */}
          {isLoggedIn && menuLinks.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#8B95A1", margin: "28px 0 12px" }}>메뉴</p>
              {menuLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "16px 4px",
                    borderBottom: "1px solid #F2F4F6",
                    textDecoration: "none",
                    color: "#191F28",
                    fontSize: 16,
                  }}
                >
                  {m.label}
                </Link>
              ))}
            </>
          )}

          {/* 로그인/로그아웃 */}
          <div style={{ marginTop: 28 }}>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  border: "1px solid #E5E8EB",
                  background: "#F2F4F6",
                  padding: "16px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#191F28",
                  cursor: "pointer",
                }}
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  borderRadius: 14,
                  background: "#3182F6",
                  padding: "16px 24px",
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
        </div>
      </aside>
    </>
  );
}
