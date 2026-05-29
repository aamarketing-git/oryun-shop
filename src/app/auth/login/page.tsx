import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; redirect?: string };
}) {
  const next = searchParams.next ?? searchParams.redirect;
  const isPurchase = next?.startsWith("/checkout");
  const registerHref = next ? `/auth/register?next=${encodeURIComponent(next)}` : "/auth/register";

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">로그인</h1>
          <p className="text-sm text-muted-foreground">
            {isPurchase
              ? "주문을 진행하려면 로그인이 필요해요."
              : "오륜쇼핑몰 계정으로 로그인하세요."}
          </p>
        </div>

        {isPurchase && (
          <div className="mb-6 rounded-xl bg-[#E8F1FE] border border-[#C7DCFC] p-4 text-center">
            <p className="text-sm text-[#1B64DA]">
              💳 로그인하시면 선택하신 상품의 주문 화면으로 이동합니다.
            </p>
          </div>
        )}

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground mt-6">
          아직 계정이 없으신가요?{" "}
          <Link href={registerHref} className="link-apple">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
