"use client";

import Link from "next/link";

export function BuyButton({
  productId, price, available,
}: { productId: string; price: number; available: boolean }) {
  if (!available) {
    return (
      <button disabled className="btn-apple w-full opacity-50 cursor-not-allowed">
        품절
      </button>
    );
  }
  return (
    <Link href={`/checkout?product=${productId}`} className="btn-apple w-full">
      구매하기
    </Link>
  );
}
