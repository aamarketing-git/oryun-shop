"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ApproveSellerButton({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  function approve() {
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase.rpc("approve_seller", { p_seller_id: sellerId });
      if (error) return alert("승인 실패: " + error.message);
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) return alert("거절 사유를 입력하세요.");
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase
        .from("sellers")
        .update({ status: "rejected", rejected_reason: reason })
        .eq("id", sellerId);
      if (error) return alert("거절 실패: " + error.message);
      router.refresh();
    });
  }

  if (showReject) {
    return (
      <div className="flex gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="거절 사유"
          className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg"
        />
        <button onClick={reject} disabled={pending} className="px-3 py-1.5 text-sm bg-destructive text-white rounded-lg">
          확인
        </button>
        <button onClick={() => setShowReject(false)} className="px-3 py-1.5 text-sm text-muted-foreground">
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={pending} className="btn-apple py-1.5">
        승인
      </button>
      <button onClick={() => setShowReject(true)} className="px-4 py-1.5 text-sm text-destructive rounded-full border border-destructive">
        거절
      </button>
    </div>
  );
}
