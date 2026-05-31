import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, Search } from "lucide-react";
import { MenuDrawer } from "./MenuDrawer";

export async function Header() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    role = profile?.role ?? null;
  }

  const accountHref =
    role === "admin" ? "/admin/dashboard" : role === "seller" ? "/seller/dashboard" : "/account";

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/60"
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      <nav className="apple-container">
        <div className="flex items-center h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-[28px] md:text-[38px] tracking-tight font-bold text-foreground mr-auto hover:opacity-70 transition leading-none"
          >
            오륜쇼핑몰
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/products" aria-label="검색" className="opacity-80 hover:opacity-100 transition">
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              // 로그인 상태: 주문 아이콘 표시
              <Link href="/account/orders" aria-label="주문" className="opacity-80 hover:opacity-100 transition">
                <ShoppingBag className="h-5 w-5" />
              </Link>
            ) : (
              // 비로그인 상태: 작은 "로그인" 텍스트
              <Link
                href="/auth/login"
                className="text-[13px] text-muted-foreground hover:text-foreground transition"
              >
                로그인
              </Link>
            )}

            <MenuDrawer isLoggedIn={!!user} accountHref={accountHref} userRole={role} />
          </div>
        </div>
      </nav>
    </header>
  );
}
