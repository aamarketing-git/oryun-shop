"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resubmitProduct } from "@/app/actions/products";

export function ResubmitButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("이 상품을 다시 승인 요청하시겠습니까?\n관리자가 다시 검토합니다.")) return;
    setError(null);
    startTransition(async () => {
      const result = await resubmitProduct(productId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50 transition"
      >
        {pending ? "요청 중..." : "재요청"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
