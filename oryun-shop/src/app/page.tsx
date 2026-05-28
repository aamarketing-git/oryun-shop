import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { Search } from "lucide-react";

export const revalidate = 60; // ISR 1분

export default async function HomePage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, short_description, price_krw, main_image_url, category_id")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <>
      {/* ====== 인트로 + 검색 진입 ====== */}
      <section className="apple-container pt-8 pb-3">
        <p className="text-[13px] text-muted-foreground mb-1.5">스토어</p>
        <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight leading-[1.15] text-foreground">
          무엇을 찾고 계세요?
        </h1>
      </section>

      <section className="apple-container pb-5">
        <Link
          href="/products"
          className="flex items-center gap-2.5 rounded-[14px] bg-muted px-4 py-3.5 text-muted-foreground hover:bg-[#E5E8EB] transition"
        >
          <Search className="h-[18px] w-[18px]" />
          <span className="text-[15px]">상품을 검색해보세요</span>
        </Link>
      </section>

      {/* ====== 상품 그리드 (홈 = 상품 우선) ====== */}
      <section className="apple-container pb-24">
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block">
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 relative">
                  {p.main_image_url ? (
                    <Image
                      src={p.main_image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width:768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      이미지 준비중
                    </div>
                  )}
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-1 leading-snug">
                  {p.name}
                </h3>
                <p className="text-[15px] font-bold text-foreground">
                  {formatKRW(Number(p.price_krw))}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-[17px] font-semibold mb-2">아직 등록된 상품이 없어요</p>
            <p className="text-sm text-muted-foreground">곧 멋진 상품들로 찾아뵐게요.</p>
          </div>
        )}
      </section>
    </>
  );
}
