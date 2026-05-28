"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronRight, Laptop, Coins, Shirt, Headphones } from "lucide-react";

const CATEGORIES = [
  { href: "/products?category=digital", label: "디지털", icon: Laptop },
  { href: "/products?category=staking", label: "스테이킹", icon: Coins },
  { href: "/products?category=lifestyle", label: "라이프", icon: Shirt },
  { href: "/products?category=accessories", label: "액세서리", icon: Headphones },
];

const MENU_LINKS = [
  { href: "/account/orders", label: "내 주문" },
  { href: "/account/inquiries", label: "문의 내역" },
  { href: "/account", label: "내 정보" },
  { href: "/support", label: "고객센터" },
];

export function MenuDrawer({
  isLoggedIn,
  accountHref,
}: {
  isLoggedIn: boolean;
  accountHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="전체 메뉴"
        className="opacity-80 hover:opacity-100 transition"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[200] bg-black/40 transition-opacity duration-250 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[201] w-[360px] max-w-[85vw] bg-background shadow-2xl
          flex flex-col transition-transform duration-250 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[20px] font-bold tracking-tight">전체 메뉴</span>
          <button onClick={() => setOpen(false)} aria-label="닫기">
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">카테고리</p>
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[14px] bg-muted px-4 py-4 hover:bg-[#E5E8EB] transition"
                >
                  <Icon className="h-[22px] w-[22px] text-primary" />
                  <span className="text-[15px] font-medium">{c.label}</span>
                </Link>
              );
            })}
          </div>

          <p className="text-[13px] font-semibold text-muted-foreground mb-3 mt-6">메뉴</p>
          <div>
            {MENU_LINKS.map((m) => (
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

          {isLoggedIn ? (
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="btn-toss-block mt-6"
            >
              마이페이지
            </Link>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="btn-toss-block mt-6"
            >
              로그인 / 회원가입
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
