import { createServiceClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { UpdateRateForm } from "@/components/admin/UpdateRateForm";

export const dynamic = "force-dynamic";

export default async function AdminRatePage() {
  const supabase = createServiceClient();
  const { data: setting } = await supabase
    .from("settings")
    .select("value, updated_at, updated_by")
    .eq("key", "usdt_krw_rate")
    .single();

  const currentRate = setting?.value ? Number(setting.value) : 1500;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-2">USDT 환율 관리</h1>
      <p className="text-sm text-muted-foreground mb-8">
        USDT 결제 시 KRW 변환에 사용되는 환율입니다. 주문 시점에 잠금되므로 변경은 이후 주문부터 적용됩니다.
      </p>

      <div className="bg-background border border-border rounded-xl p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-2">현재 환율</p>
        <p className="text-3xl font-semibold">1 USDT = {formatKRW(currentRate)}</p>
        {setting?.updated_at && (
          <p className="text-xs text-muted-foreground mt-2">
            마지막 수정: {new Date(setting.updated_at).toLocaleString("ko-KR")}
          </p>
        )}
      </div>

      <UpdateRateForm currentRate={currentRate} />
    </div>
  );
}
