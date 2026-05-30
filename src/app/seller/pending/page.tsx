import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_INFO: Record<
  string,
  { title: string; description: string; color: string; bg: string }
> = {
  pending: {
    title: "공급자 승인 대기 중",
    description: "관리자가 신청 내용을 검토하고 있어요. 보통 1~2영업일 안에 처리됩니다.",
    color: "#F59E0B",
    bg: "#FFF7E6",
  },
  approved: {
    title: "공급자 승인 완료",
    description: "축하합니다! 이제 상품을 등록할 수 있어요.",
    color: "#06A776",
    bg: "#ECFDF5",
  },
  rejected: {
    title: "신청이 거절되었습니다",
    description: "사유를 확인하고 정보를 수정한 뒤 관리자에게 재검토를 요청하세요.",
    color: "#F04452",
    bg: "#FFF1F2",
  },
  blocked: {
    title: "계정이 차단되었습니다",
    description: "관리자에게 문의해주세요.",
    color: "#8B95A1",
    bg: "#F2F4F6",
  },
};

export default async function SellerPendingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: seller } = await supabase
    .from("sellers")
    .select("status, business_name, representative_name, rejected_reason, created_at")
    .eq("user_id", user.id)
    .single();

  // 공급자 신청 자체가 없으면 홈으로
  if (!seller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <p className="section-eyebrow mb-2">Seller</p>
          <h1 className="text-2xl font-semibold mb-3">공급자 신청 내역이 없어요</h1>
          <p className="text-sm text-muted-foreground mb-6">
            아직 공급자로 신청하지 않으셨어요. 공급자로 가입하시려면 회원가입에서 공급자를 선택해주세요.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register?role=seller" className="btn-apple">공급자 신청하기</Link>
            <Link href="/" className="link-apple">홈으로</Link>
          </div>
        </div>
      </div>
    );
  }

  const info = STATUS_INFO[seller.status] ?? STATUS_INFO.pending;

  // 승인된 경우엔 대시보드로 자동 이동
  if (seller.status === "approved") {
    redirect("/seller/dashboard");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <p className="section-eyebrow text-center mb-2">Seller</p>

        {/* 상태 배지 */}
        <div className="text-center mb-6">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: info.bg, color: info.color }}
          >
            {info.title}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-center mb-3">
          {seller.business_name ?? "공급자 신청"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {info.description}
        </p>

        {/* 거절된 경우: 사유 + 안내 */}
        {seller.status === "rejected" && seller.rejected_reason && (
          <div
            className="rounded-xl p-4 mb-6 text-sm"
            style={{ background: info.bg, color: info.color, border: `1px solid ${info.color}33` }}
          >
            <p className="font-semibold mb-1">관리자 사유</p>
            <p>{seller.rejected_reason}</p>
          </div>
        )}

        {/* 신청 정보 요약 */}
        <div className="rounded-2xl border border-border bg-background p-6 mb-6">
          <h2 className="text-sm font-semibold mb-3">신청 정보</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">상호명</dt>
              <dd>{seller.business_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">대표자명</dt>
              <dd>{seller.representative_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">신청일</dt>
              <dd>
                {seller.created_at
                  ? new Date(seller.created_at).toLocaleDateString("ko-KR")
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 justify-center">
          {(seller.status === "rejected" || seller.status === "pending") && (
            <Link href="/seller/settings" className="btn-apple">신청 정보 수정</Link>
          )}
          <Link href="/" className="link-apple">홈으로</Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          승인 처리 후 자동으로 공급자 대시보드로 이동합니다.
        </p>
      </div>
    </div>
  );
}
