import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/rbac";
import { getUsdtKrwRate } from "@/lib/usdt";
import { formatKRW, formatUSDT } from "@/lib/utils";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { product?: string };
}) {
  await requireAuth();
  if (!searchParams.product) redirect("/products");

  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select(`
      id, name, price_krw, stock, main_image_url,
      seller:sellers!inner(business_name, bank_name, bank_account_number, bank_account_holder)
    `)
    .eq("id", searchParams.product)
    .eq("status", "approved")
    .single();

  if (!product || product.stock <= 0) redirect("/products");

  const usdtRate = await getUsdtKrwRate();
  const totalUsdt = Number(product.price_krw) / usdtRate;
  const seller = Array.isArray(product.seller) ? product.seller[0] : product.seller;

  return (
    <div className="apple-container py-16 max-w-3xl">
      <h1 className="text-headline mb-2">주문 결제</h1>
      <p className="text-muted-foreground mb-10">주문 정보를 확인하고 결제를 완료해주세요.</p>

      {/* 주문 요약 */}
      <section className="bg-muted rounded-xl p-6 mb-8">
        <h2 className="text-sm font-medium mb-4">주문 내역</h2>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{product.name}</span>
          <span>{formatKRW(Number(product.price_krw))}</span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">공급자</span>
          <span>{seller?.business_name}</span>
        </div>
        <div className="border-t border-border pt-3 mt-3 flex items-center justify-between font-medium">
          <span>총 결제 금액</span>
          <div className="text-right">
            <p>{formatKRW(Number(product.price_krw))}</p>
            <p className="text-xs text-muted-foreground font-normal">
              ≈ {formatUSDT(totalUsdt)} (USDT 결제 시)
            </p>
          </div>
        </div>
      </section>

      <CheckoutForm
        productId={product.id}
        priceKrw={Number(product.price_krw)}
        totalUsdt={totalUsdt}
        usdtRate={usdtRate}
        sellerBank={{
          name: seller?.bank_name ?? "",
          account: seller?.bank_account_number ?? "",
          holder: seller?.bank_account_holder ?? "",
        }}
      />
    </div>
  );
}
