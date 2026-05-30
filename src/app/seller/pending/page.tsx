import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_INFO: Record<
  string,
  { badge: string; title: string; description: string; color: string; bg: string; border: string }
> = {
  pending: {
    badge: "승인 대기 중",
    title: "공급자 신청이 접수되었습니다",
    description:
      "관리자가 신청 내용을 검토하고 있어요. 보통 1~2영업일 안에 처리되며, 승인되면 자동으로 공급자 대시보드를 사용할 수 있어요.",
    color: "#B45309",
    bg: "#FEF3C7",
    border: "#FCD34D",
  },
  approved: {
    badge: "✓ 승인 완료",
    title: "공급자 승인이 완료되었어요!",
    description: "이제 상품을 등록하고 판매를 시작할 수 있어요.",
    color: "#047857",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  rejected: {
    badge: "신청 거절됨",
    title: "신청이 거절되었어요",
    description: "거절 사유를 확인하고 정보를 수정한 후 재요청해주세요.",
    color: "#B91C1C",
    bg: "#FEE2E2",
    border: "#FCA5A5",
  },
  blocked: {
    badge: "계정 차단됨",
    title: "계정이 차단되었어요",
    description: "관리자에게 문의해주세요.",
    color: "#374151",
    bg: "#F3F4F6",
    border: "#D1D5DB",
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
    .select("status, business_name, representative_name, contact_phone, bank_name, rejected_reason, created_at")
    .eq("user_id", user.id)
    .single();

  // 공급자 신청 내역이 없으면 → 신청 페이지로 유도
  if (!seller) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold mb-3">공급자 신청 내역이 없어요</h1>
          <p className="text-sm text-muted-foreground mb-8">
            아직 공급자로 신청하지 않으셨어요. 공급자가 되시려면 신청 정보를 입력해주세요.
          </p>
          <Link
            href="/auth/register?role=seller"
            className="inline-block rounded-[14px] bg-[#3182F6] text-white font-semibold px-6 py-3 hover:bg-[#1B64DA] transition"
          >
            공급자 신청하기
          </Link>
          <p className="mt-4 text-xs text-gray-500">
            <Link href="/" className="hover:underline">← 홈으로</Link>
          </p>
        </div>
      </div>
    );
  }

  // 승인된 경우 → 대시보드로 자동 이동
  if (seller.status === "approved") {
    redirect("/seller/dashboard");
  }

  const info = STATUS_INFO[seller.status] ?? STATUS_INFO.pending;

  return (
    <div className="min-h-[70vh] py-16 px-6">
      <div className="max-w-xl mx-auto">
        {/* 큰 상태 배지 */}
        <div
          className="rounded-2xl p-8 mb-8 text-center"
          style={{ background: info.bg, border: `2px solid ${info.border}` }}
        >
          <p
            className="text-sm font-bold mb-2 tracking-wide"
            style={{ color: info.color }}
          >
            {info.badge}
          </p>
          <h1
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: info.color }}
          >
            {info.title}
          </h1>
          <p className="text-sm" style={{ color: info.color }}>
            {info.description}
          </p>
        </div>

        {/* 거절 사유 (있을 때만) */}
        {seller.status === "rejected" && seller.rejected_reason && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm font-semibold text-red-700 mb-1">관리자 사유</p>
            <p className="text-sm text-red-700">{seller.rejected_reason}</p>
          </div>
        )}

        {/* 신청 정보 요약 */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">신청 정보</h2>
          <dl className="divide-y divide-gray-100">
            <Row label="상호명" value={seller.business_name ?? "—"} />
            <Row label="대표자명" value={seller.representative_name ?? "—"} />
            <Row label="연락처" value={seller.contact_phone ?? "—"} />
            <Row label="입금 은행" value={seller.bank_name ?? "—"} />
            <Row
              label="신청일"
              value={
                seller.created_at
                  ? new Date(seller.created_at).toLocaleDateString("ko-KR")
                  : "—"
              }
            />
          </dl>
        </section>

        {/* 안내 박스 */}
        {seller.status === "pending" && (
          <div className="rounded-xl bg-[#E8F1FE] border border-[#C7DCFC] p-4 text-sm text-[#1B64DA] mb-6">
            💡 <strong>지금은 무엇을 할 수 있나요?</strong>
            <ul className="mt-2 space-y-1 text-[#1B64DA]/90 ml-5 list-disc">
              <li>이 페이지를 새로고침하여 승인 상태를 확인할 수 있어요.</li>
              <li>승인 전에도 신청 정보(은행/지갑/연락처)를 수정할 수 있어요.</li>
              <li>승인이 완료되면 자동으로 공급자 대시보드로 이동합니다.</li>
            </ul>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3 justify-center">
          {(seller.status === "pending" || seller.status === "rejected") && (
            <Link
              href="/seller/settings"
              className="rounded-[14px] border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            >
              신청 정보 수정
            </Link>
          )}
          <Link
            href="/"
            className="rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#1B64DA] transition"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}
