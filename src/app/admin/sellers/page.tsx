import { createServiceClient } from "@/lib/supabase/server";
import { ApproveSellerButton } from "@/components/admin/ApproveSellerButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createServiceClient();
  const status = searchParams.status ?? "pending";

  const { data: sellers } = await supabase
    .from("sellers")
    .select(`
      id, business_name, representative_name, contact_phone, status, created_at,
      bank_name, bank_account_number, bank_account_holder,
      usdt_wallet_trc20, business_license_url,
      user:profiles!sellers_user_id_fkey(email)
    `)
    .eq("status", status)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">공급자 관리</h1>
      <div className="flex gap-3 mb-6 text-sm">
        {(["pending", "approved", "rejected", "blocked"] as const).map((s) => (
          <a
            key={s}
            href={`?status=${s}`}
            className={`px-3 py-1 rounded-full ${
              status === s ? "bg-foreground text-background" : "bg-background border border-border"
            }`}
          >
            {labelOf(s)}
          </a>
        ))}
      </div>

      {!sellers || sellers.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-12 text-center text-muted-foreground">
          해당 상태의 공급자가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {sellers.map((s) => (
            <div key={s.id} className="bg-background border border-border rounded-xl p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{s.business_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {s.representative_name} · {s.contact_phone} · {(s.user as { email: string } | null)?.email}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(s.created_at)}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-4">
                <Info label="은행" value={`${s.bank_name} ${s.bank_account_number}`} />
                <Info label="예금주" value={s.bank_account_holder ?? "-"} />
                <Info label="USDT 지갑" value={s.usdt_wallet_trc20 ?? "-"} />
              </div>
              {status === "pending" && <ApproveSellerButton sellerId={s.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function labelOf(s: string) {
  return { pending: "승인 대기", approved: "승인됨", rejected: "거절됨", blocked: "차단됨" }[s as "pending"];
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
