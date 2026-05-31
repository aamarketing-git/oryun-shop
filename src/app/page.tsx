import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";

export const revalidate = 60; // ISR 1분

export default async function HomePage() {
  const supabase = createClient();

  // 카테고리 + 그 카테고리의 상품들
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("display_order");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, short_description, price_krw, main_image_url, category_id")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  // 카테고리별 상품 분류
  const productsByCategory: Record<string, typeof products> = {};
  const productsWithoutCategory: typeof products = [];
  for (const p of products ?? []) {
    if (p.category_id) {
      if (!productsByCategory[p.category_id]) {
        productsByCategory[p.category_id] = [];
      }
      productsByCategory[p.category_id]!.push(p);
    } else {
      productsWithoutCategory.push(p);
    }
  }

  return (
    <>
      {/* ====== 인트로 + 검색 진입 ====== */}
      <section className="apple-container pt-6 pb-3">
        <p className="text-[13px] text-muted-foreground mb-1.5">스토어</p>
        <h1 className="text-[24px] md:text-[30px] font-bold tracking-tight leading-[1.2] text-foreground">
          무엇을 찾고 계세요?
        </h1>
      </section>

      <section className="apple-container pb-4">
        <Link
          href="/products"
          className="flex items-center gap-2.5 rounded-[14px] bg-muted px-4 py-3.5 text-muted-foreground hover:bg-[#E5E8EB] transition"
        >
          <Search className="h-[18px] w-[18px]" />
          <span className="text-[15px]">상품을 검색해보세요</span>
        </Link>
      </section>

      {(!products || products.length === 0) && (
        <section className="apple-container py-20 text-center">
          <p className="text-[17px] font-semibold mb-2">아직 등록된 상품이 없어요</p>
          <p className="text-sm text-muted-foreground">곧 멋진 상품들로 찾아뵐게요.</p>
        </section>
      )}

      {/* ====== 카테고리별 가로 스크롤 캐러셀 ====== */}
      {categories?.map((cat) => {
        const catProducts = productsByCategory[cat.id];
        if (!catProducts || catProducts.length === 0) return null;
        return (
          <section key={cat.id} className="pt-2 pb-6">
            {/* 헤더 */}
            <div className="apple-container flex items-end justify-between mb-3">
              <h2 className="text-[19px] md:text-[22px] font-bold text-foreground">
                {cat.name}
              </h2>
              <Link
                href={`/products?category=${cat.slug}`}
                className="text-[13px] text-[#3182F6] font-semibold hover:underline flex items-center"
              >
                전체보기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* 캐러셀 — 화면 끝까지 확장, 첫/마지막 카드만 padding */}
            <div className="h-scroll px-5 md:px-8">
              {catProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="h-scroll-card group block"
                >
                  <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-2 relative">
                    {p.main_image_url ? (
                      <Image
                        src={p.main_image_url}
                        alt={p.name}
                        fill
                        sizes="(max-width:768px) 44vw, 240px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        이미지 준비중
                      </div>
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-foreground mb-0.5 leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-[14px] font-bold text-foreground">
                    {formatKRW(Number(p.price_krw))}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* ====== 분류 없음 상품 ====== */}
      {productsWithoutCategory.length > 0 && (
        <section className="pt-2 pb-6">
          <div className="apple-container mb-3">
            <h2 className="text-[19px] md:text-[22px] font-bold text-foreground">
              기타 상품
            </h2>
          </div>
          <div className="h-scroll px-5 md:px-8">
            {productsWithoutCategory.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="h-scroll-card group block"
              >
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-2 relative">
                  {p.main_image_url ? (
                    <Image
                      src={p.main_image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width:768px) 44vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      이미지 준비중
                    </div>
                  )}
                </div>
                <h3 className="text-[13px] font-semibold text-foreground mb-0.5 leading-snug line-clamp-2">
                  {p.name}
                </h3>
                <p className="text-[14px] font-bold text-foreground">
                  {formatKRW(Number(p.price_krw))}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 하단 여백 */}
      <div className="pb-16" />
    </>
  );
}
