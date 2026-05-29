import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Role = "admin" | "seller" | "customer";

/**
 * 인증된 사용자 + role 반환. 미인증 시 로그인 페이지로 리다이렉트.
 * @param redirectTo  로그인 후 돌아갈 경로 (예: "/checkout?product=abc")
 */
export async function requireAuth(redirectTo?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const loginUrl = redirectTo
    ? `/auth/login?next=${encodeURIComponent(redirectTo)}`
    : "/auth/login";
  if (!user) redirect(loginUrl);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, name, email")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(loginUrl);
  return { user, profile };
}

export async function requireRole(role: Role | Role[]) {
  const { user, profile } = await requireAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(profile.role as Role)) {
    redirect("/"); // 권한 부족 → 메인으로
  }
  return { user, profile };
}

export const requireAdmin = () => requireRole("admin");
export const requireSeller = () => requireRole(["seller", "admin"]);
