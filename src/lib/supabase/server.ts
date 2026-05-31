import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * 서버 컴포넌트, 서버 액션, Route Handler에서 사용하는 Supabase 클라이언트.
 * 쿠키 기반으로 세션을 유지하며, RLS가 자동 적용됩니다.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component에서는 set 불가 (middleware에서 처리)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    },
  );
}

/**
 * Service Role (RLS 우회) - 절대 클라이언트에 노출하지 말 것!
 * 관리자 작업, 시스템 작업 전용.
 */
export function createServiceClient() {
  // SUPABASE_SERVICE_ROLE_KEY는 서버 환경변수 (NEXT_PUBLIC_ 없음)
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { get: () => undefined, set: () => {}, remove: () => {} },
    },
  );
}
