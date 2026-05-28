import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage({
  searchParams,
}: { searchParams: { role?: string } }) {
  const isSeller = searchParams.role === "seller";

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-headline mb-2">
            {isSeller ? "공급자 신청" : "회원가입"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSeller
              ? "관리자 승인 후 판매를 시작할 수 있습니다."
              : "오륜쇼핑몰와 함께 쇼핑을 시작하세요."}
          </p>
        </div>
        <RegisterForm isSeller={isSeller} />
        <p className="text-center text-sm text-muted-foreground mt-6">
          이미 계정이 있으신가요? <Link href="/auth/login" className="link-apple">로그인</Link>
        </p>
      </div>
    </div>
  );
}
