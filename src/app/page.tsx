import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { Search, ChevronRight } from "lucide-react";

export const revalidate = 60; // ISR 1분

export default async function HomePage() {
  const supabase = createClient();

  // 카테고리 + 상품 데이터
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, name, short_description, price_krw, main_image_url, category_id")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // 카테고리별 상품 분류 (모바일용)
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

  const hasProducts = products && products.length > 0;

  return (
    <>
      {/* ====== 상단 검색바 + 전체보기 ====== */}
      <section className="apple-container pt-5 pb-4">
        <form
          action="/products"
          method="GET"
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="h-[18px] w-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              name="q"
              placeholder="상품을 검색해보세요"
              className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-muted text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#3182F6] focus:border-[#3182F6] border border-transparent"
            />
          </div>
          <button
            type="submit"
            className="rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-3.5 text-sm hover:bg-[#1B64DA] transition whitespace-nowrap"
          >
            검색
          </button>
        </form>

        {/* 모바일에서만 — "전체 상품 보기" 빠른 링크 */}
        <div className="md:hidden mt-3 flex justify-end">
          <Link
            href="/products"
            className="text-[13px] text-[#3182F6] font-semibold hover:underline flex items-center"
          >
            전체 상품 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ====== 상품 없을 때 ====== */}
      {!hasProducts && (
        <section className="apple-container py-20 text-center">
          <p className="text-[17px] font-semibold mb-2">아직 등록된 상품이 없어요</p>
          <p className="text-sm text-muted-foreground">곧 멋진 상품들로 찾아뵐게요.</p>
        </section>
      )}

      {/* ====== PC 화면: 전체 상품 그리드 ====== */}
      {hasProducts && (
        <section className="hidden md:block apple-container pb-20">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[22px] font-bold text-foreground">전체 상품</h2>
            <Link
              href="/products"
              className="text-sm text-[#3182F6] font-semibold hover:underline"
            >
              더 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group block"
              >
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-3 relative">
                  {p.main_image_url ? (
                    <Image
                      src={p.main_image_url}
                      alt={p.name}
                      fill
                      sizes="(max-width:1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      이미지 준비중
                    </div>
                  )}
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-1 leading-snug line-clamp-2">
                  {p.name}
                </h3>
                <p className="text-[15px] font-bold text-foreground">
                  {formatKRW(Number(p.price_krw))}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ====== 모바일 화면: 카테고리별 가로 슬라이딩 ====== */}
      {hasProducts && (
        <div className="md:hidden">
          {/* 카테고리 분류가 된 상품이 하나도 없으면 → 전체 상품 한 줄로 폴백 */}
          {(() => {
            const anyInCategory = categories?.some((c) => productsByCategory[c.id]?.length);
            if (!anyInCategory) {
              return (
                <section className="pt-2 pb-6">
                  <div className="apple-container mb-3">
                    <h2 className="text-[19px] font-bold text-foreground">전체 상품</h2>
                  </div>
                  <div className="h-scroll px-5">
                    {products.map((p) => (
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
                              sizes="44vw"
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
            }
            return null;
          })()}

          {categories?.map((cat) => {
            const catProducts = productsByCategory[cat.id];
            if (!catProducts || catProducts.length === 0) return null;
            return (
              <section key={cat.id} className="pt-2 pb-6">
                {/* 카테고리 헤더 */}
                <div className="apple-container flex items-end justify-between mb-3">
                  <h2 className="text-[19px] font-bold text-foreground">
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

                {/* 가로 슬라이딩 캐러셀 */}
                <div className="h-scroll px-5">
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
                            sizes="44vw"
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

          {/* 분류 없음 상품 (있을 때만) */}
          {productsWithoutCategory.length > 0 && (
            <section className="pt-2 pb-6">
              <div className="apple-container mb-3">
                <h2 className="text-[19px] font-bold text-foreground">
                  기타 상품
                </h2>
              </div>
              <div className="h-scroll px-5">
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
                          sizes="44vw"
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

          {/* 모바일 하단 여백 */}
          <div className="pb-12" />
        </div>
      )}
    </>
  );
}
