import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CopyText } from "@/components/ui/CopyText";

export const revalidate = 60;

export default async function SellersListPage() {
  const supabase = createClient();

  // 승인된 공급자만 노출
  const { data: sellers } = await supabase
    .from("sellers")
    .select("id, business_name, representative_name, contact_phone, contact_kakao, contact_telegram")
    .eq("status", "approved")
    .order("business_name");

  return (
    <div className="apple-container py-10">
      <p className="section-eyebrow">고객센터</p>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold">공급자 연락처</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        제품 · 배송 · 반품 등 상품 관련 문의는 각 공급자에게 직접 연락해주세요.
        <br />
        상담 가능 시간: 평일 10:00 ~ 18:00 (점심 12:00 ~ 13:00 제외)
      </p>

      {!sellers || sellers.length === 0 ? (
        <div className="mt-8 py-16 text-center">
          <p className="text-base text-muted-foreground">
            아직 등록된 공급자가 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-3">
                <h3 className="font-bold text-base text-foreground">
                  {s.business_name}
                </h3>
                {s.representative_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    대표: {s.representative_name}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                {s.contact_phone && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      📞 전화
                    </span>
                    <a
                      href={`tel:${s.contact_phone.replace(/\D/g, "")}`}
                      className="text-sm font-semibold text-foreground hover:text-[#3182F6]"
                    >
                      {s.contact_phone}
                    </a>
                  </div>
                )}
                {s.contact_kakao && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      💬 카톡
                    </span>
                    <CopyText
                      value={s.contact_kakao}
                      display={s.contact_kakao}
                      label="카톡 ID"
                    />
                  </div>
                )}
                {s.contact_telegram && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ✈️ 텔레그램
                    </span>
                    <CopyText
                      value={s.contact_telegram}
                      display={s.contact_telegram}
                      label="텔레그램"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 운영팀 안내 — 일반 공개 X, 안내만 */}
      <div className="mt-10 rounded-2xl bg-gray-50 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          공급자가 응답하지 않거나 운영 관련 문의가 필요한 경우,
          <br />
          공급자 본인은 <Link href="/seller/dashboard" className="text-[#3182F6] font-semibold hover:underline">공급자 센터</Link>를 통해 운영팀에 문의하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}
