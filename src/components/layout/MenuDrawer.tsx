"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { href: "/products?category=health", label: "건강(식품)", icon: "🌿" },
  { href: "/products?category=cosmetics", label: "화장품", icon: "💄" },
  { href: "/products?category=living", label: "생활용품", icon: "🏠" },
  { href: "/products?category=etc", label: "기타", icon: "📦" },
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
  // 'main' = 카테고리/메뉴 같이 보이는 메인, 'menu' = 메뉴만 (탭 전환)
  const [view, setView] = useState<"categories" | "menu">("categories");
  const router = useRouter();

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 드로어 닫힐 때 카테고리 탭으로 리셋
  useEffect(() => {
    if (!open) setView("categories");
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // 로그인 사용자의 메뉴 항목들
  const menuLinks = isLoggedIn
    ? [
        { href: "/account/orders", label: "내 주문", icon: "📋" },
        { href: "/account", label: "내 정보", icon: "👤" },
        ...(userRole === "admin"
          ? [{ href: "/admin/dashboard", label: "관리자 페이지", icon: "🛡️" }]
          : []),
        ...(userRole === "seller"
          ? [{ href: "/seller/dashboard", label: "공급자 페이지", icon: "🏪" }]
          : []),
      ]
    : [];

  const hasMenu = isLoggedIn && menuLinks.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="전체 메뉴"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 22,
          lineHeight: 1,
          padding: 4,
        }}
      >
        ☰
      </button>

      {/* 어두운 오버레이 */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.4)",
          }}
        />
      )}

      {/* 드로어 본체 */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          zIndex: 201,
          width: "min(420px, 90vw)",
          background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease-out",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 상단 헤더 */}
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
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: "#191F28" }}>
            오륜쇼핑몰
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="닫기"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#8B95A1",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* 탭 전환 (로그인했고 메뉴 있을 때만) */}
        {hasMenu && (
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #E5E8EB",
              background: "#fff",
              position: "sticky",
              top: 57,
              zIndex: 9,
            }}
          >
            <button
              onClick={() => setView("categories")}
              style={{
                flex: 1,
                padding: "14px 0",
                border: "none",
                background: "none",
                fontSize: 15,
                fontWeight: view === "categories" ? 700 : 500,
                color: view === "categories" ? "#3182F6" : "#8B95A1",
                cursor: "pointer",
                borderBottom: view === "categories" ? "2px solid #3182F6" : "2px solid transparent",
              }}
            >
              카테고리
            </button>
            <button
              onClick={() => setView("menu")}
              style={{
                flex: 1,
                padding: "14px 0",
                border: "none",
                background: "none",
                fontSize: 15,
                fontWeight: view === "menu" ? 700 : 500,
                color: view === "menu" ? "#3182F6" : "#8B95A1",
                cursor: "pointer",
                borderBottom: view === "menu" ? "2px solid #3182F6" : "2px solid transparent",
              }}
            >
              메뉴
            </button>
          </div>
        )}

        {/* 내용 — 카테고리 또는 메뉴 */}
        <div style={{ padding: "20px", flex: 1 }}>
          {view === "categories" ? (
            // ===== 카테고리 화면 =====
            <>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#8B95A1",
                  margin: "0 0 12px",
                }}
              >
                카테고리
              </p>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    borderRadius: 14,
                    background: "#F2F4F6",
                    padding: "16px 18px",
                    marginBottom: 8,
                    textDecoration: "none",
                    color: "#191F28",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  {c.label}
                </Link>
              ))}
            </>
          ) : (
            // ===== 메뉴 화면 =====
            <>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#8B95A1",
                  margin: "0 0 12px",
                }}
              >
                내 정보
              </p>
              {menuLinks.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 4px",
                    borderBottom: "1px solid #F2F4F6",
                    textDecoration: "none",
                    color: "#191F28",
                    fontSize: 15,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  {m.label}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* 하단 — 로그인/로그아웃 (항상 보임) */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #E5E8EB",
            background: "#fff",
            position: "sticky",
            bottom: 0,
          }}
        >
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
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
