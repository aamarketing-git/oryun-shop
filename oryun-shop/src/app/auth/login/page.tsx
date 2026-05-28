import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-headline mb-2">로그인</h1>
          <p className="text-sm text-muted-foreground">오륜쇼핑몰 계정으로 로그인하세요.</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          아직 계정이 없으신가요?{" "}
          <Link href="/auth/register" className="link-apple">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
