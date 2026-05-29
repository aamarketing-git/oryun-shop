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

  // 모바일에서 배경 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 로그인 상태에 따라 메뉴 항목 결정
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

      {/* Overlay (배경 어둡게 + 외부 클릭 시 닫힘) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[200] bg-black/40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[201] w-full sm:w-[380px] sm:max-w-[90vw]
          bg-background shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <span className="text-[20px] font-bold tracking-tight">전체 메뉴</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="닫기"
            className="p-1 -mr-1 hover:opacity-70 transition"
          >
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* 카테고리 */}
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">카테고리</p>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[14px] bg-muted px-4 py-4 hover:bg-[#E5E8EB] active:scale-[0.98] transition"
                >
                  <Icon className="h-[22px] w-[22px] text-primary flex-shrink-0" />
                  <span className="text-[15px] font-medium">{c.label}</span>
                </Link>
              );
            })}
          </div>

          {/* 메뉴 (로그인 시) */}
          {isLoggedIn && menuLinks.length > 0 && (
            <>
              <p className="text-[13px] font-semibold text-muted-foreground mb-3 mt-7">메뉴</p>
              <div>
                {menuLinks.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-[15px] px-1 border-b border-muted text-[16px] hover:text-primary transition"
                  >
                    <span>{m.label}</span>
                    <ChevronRight className="h-4 w-4 text-border" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 하단 고정: 로그인/로그아웃 버튼 */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-background">
          {isLoggedIn ? (
            <form action={signOut}>
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[14px] border border-border bg-muted px-6 py-3.5 text-[15px] font-semibold text-foreground hover:bg-[#E5E8EB] transition"
              >
                <LogOut className="h-[18px] w-[18px]" />
                로그아웃
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center rounded-[14px] bg-primary px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-[#1B64DA] transition"
            >
              로그인 / 회원가입
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
