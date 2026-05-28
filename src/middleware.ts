import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * - 모든 요청에서 Supabase 세션 쿠키를 갱신
 * - /admin → admin 권한 체크
 * - /seller → seller(또는 admin) 권한 체크
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 보호 경로
  const isAdminPath = path.startsWith("/admin");
  const isSellerPath = path.startsWith("/seller");
  const isAccountPath = path.startsWith("/account") || path.startsWith("/checkout");

  if ((isAdminPath || isSellerPath || isAccountPath) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && (isAdminPath || isSellerPath)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (isAdminPath && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isSellerPath && role !== "seller" && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // _next, 정적 자산, favicon 제외
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.).*)",
  ],
};
