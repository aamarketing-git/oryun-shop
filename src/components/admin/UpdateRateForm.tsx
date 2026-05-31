"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function UpdateRateForm({ currentRate }: { currentRate: number }) {
  const router = useRouter();
  const [rate, setRate] = useState(currentRate);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`환율을 ${rate} 원으로 변경하시겠습니까?`)) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("update_usdt_rate", { p_new_rate: rate });
      if (error) setMsg("실패: " + error.message);
      else {
        setMsg("환율이 업데이트되었습니다.");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background border border-border rounded-xl p-6">
      <label className="block text-sm font-medium mb-2">새 환율 (1 USDT = ? KRW)</label>
      <input
        type="number"
        min="1"
        step="0.01"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:border-applebrand focus:ring-1 focus:ring-applebrand mb-4"
      />
      {msg && <p className="text-sm mb-4">{msg}</p>}
      <button type="submit" disabled={pending} className="btn-apple">
        {pending ? "저장 중..." : "환율 업데이트"}
      </button>
    </form>
  );
}
