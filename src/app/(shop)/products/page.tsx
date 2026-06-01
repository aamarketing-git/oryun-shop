import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";

export const revalidate = 60;

interface SearchParams {
  category?: string;
  q?: string;
  sort?: "latest" | "price_asc" | "price_desc";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  // 카테고리 목록 (필터 UI용)
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order");

  // 상품 쿼리
  let query = supabase
    .from("products")
    .select("id, name, short_description, price_krw, main_image_url, category:categories(slug, name)")
    .eq("status", "approved");

  // 선택한 카테고리 정보 (배지에 표시용)
  let selectedCategoryName: string | null = null;
  if (searchParams.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name")
      .eq("slug", searchParams.category)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
      selectedCategoryName = cat.name;
    }
  }
  // 검색어
  if (searchParams.q) {
    const q = searchParams.q.trim();
    if (q) {
      // 이름 또는 설명에서 검색
      query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
    }
  }

  const sort = searchParams.sort ?? "latest";
  if (sort === "latest") query = query.order("created_at", { ascending: false });
  if (sort === "price_asc") query = query.order("price_krw", { ascending: true });
  if (sort === "price_desc") query = query.order("price_krw", { ascending: false });

  const { data: products } = await query.limit(60);

  // 현재 검색/필터 활성 여부
  const hasFilter = !!searchParams.q || !!searchParams.category;

  return (
    <div className="apple-container py-8 md:py-12">
      {/* 상단 타이틀 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          {searchParams.q
            ? `"${searchParams.q}" 검색 결과`
            : selectedCategoryName
              ? selectedCategoryName
              : "상품 둘러보기"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasFilter ? `${products?.length ?? 0}개의 상품` : "엄선된 공급자가 제안하는 모든 상품"}
        </p>
      </div>

      {/* 검색바 (항상 표시) */}
      <form action="/products" method="GET" className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-[18px] w-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="상품명, 설명 검색"
            className="w-full pl-11 pr-4 py-3 rounded-[14px] bg-muted text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#3182F6] focus:border-[#3182F6] border border-transparent"
          />
        </div>
        <button
          type="submit"
          className="rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-3 text-sm hover:bg-[#1B64DA] transition whitespace-nowrap"
        >
          검색
        </button>
      </form>

      {/* 적용 중 필터 배지 */}
      {hasFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {searchParams.q && (
            <FilterChip
              label={`검색: ${searchParams.q}`}
              removeHref={`/products${searchParams.category ? `?category=${searchParams.category}` : ""}`}
            />
          )}
          {selectedCategoryName && (
            <FilterChip
              label={`카테고리: ${selectedCategoryName}`}
              removeHref={`/products${searchParams.q ? `?q=${searchParams.q}` : ""}`}
            />
          )}
          <Link
            href="/products"
            className="text-xs text-gray-500 hover:text-gray-900 underline ml-1"
          >
            모두 지우기
          </Link>
        </div>
      )}

      {/* 카테고리 필터 (가로 스크롤) */}
      {categories && categories.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            <Link
              href={`/products${searchParams.q ? `?q=${searchParams.q}` : ""}`}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${
                !searchParams.category
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              전체
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}${searchParams.q ? `&q=${searchParams.q}` : ""}`}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition ${
                  searchParams.category === c.slug
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 정렬 */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border text-sm">
        <p className="text-muted-foreground">{products?.length ?? 0}개의 상품</p>
        <div className="flex gap-3">
          <SortLink current={sort} value="latest" params={searchParams}>최신순</SortLink>
          <SortLink current={sort} value="price_asc" params={searchParams}>가격 ↑</SortLink>
          <SortLink current={sort} value="price_desc" params={searchParams}>가격 ↓</SortLink>
        </div>
      </div>

      {/* 결과 */}
      {!products || products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[17px] font-semibold mb-2">
            {hasFilter ? "조건에 맞는 상품이 없습니다" : "아직 등록된 상품이 없어요"}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {hasFilter ? "다른 키워드로 검색해보세요." : "곧 멋진 상품들로 찾아뵐게요."}
          </p>
          {hasFilter && (
            <Link
              href="/products"
              className="inline-block rounded-[14px] bg-[#3182F6] text-white font-semibold px-5 py-2.5 text-sm hover:bg-[#1B64DA] transition"
            >
              전체 상품 보기
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="group block">
              <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-3 relative">
                {p.main_image_url ? (
                  <Image
                    src={p.main_image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    이미지 준비중
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold mb-1 line-clamp-2 leading-snug">
                {p.name}
              </h3>
              {p.short_description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {p.short_description}
                </p>
              )}
              <p className="text-[15px] font-bold">{formatKRW(Number(p.price_krw))}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SortLink({
  current,
  value,
  params,
  children,
}: {
  current: string;
  value: string;
  params: SearchParams;
  children: React.ReactNode;
}) {
  const newParams = new URLSearchParams();
  if (params.q) newParams.set("q", params.q);
  if (params.category) newParams.set("category", params.category);
  newParams.set("sort", value);

  return (
    <Link
      href={`?${newParams.toString()}`}
      className={
        current === value
          ? "text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}

function FilterChip({ label, removeHref }: { label: string; removeHref: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F1FE] border border-[#C7DCFC] text-[#1B64DA] px-3 py-1 text-xs font-semibold">
      {label}
      <Link href={removeHref} aria-label="필터 제거" className="hover:opacity-70">
        <X className="h-3 w-3" />
      </Link>
    </span>
  );
}
