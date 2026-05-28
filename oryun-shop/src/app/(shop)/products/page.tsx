import Link from "next/link";
import Image from "next/image";
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

  let query = supabase
    .from("products")
    .select("id, name, short_description, price_krw, main_image_url, category:categories(slug, name)")
    .eq("status", "approved");

  if (searchParams.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }

  const sort = searchParams.sort ?? "latest";
  if (sort === "latest") query = query.order("created_at", { ascending: false });
  if (sort === "price_asc") query = query.order("price_krw", { ascending: true });
  if (sort === "price_desc") query = query.order("price_krw", { ascending: false });

  const { data: products } = await query.limit(60);

  return (
    <div className="apple-container py-16">
      <div className="mb-12">
        <h1 className="text-headline mb-2">상품 둘러보기</h1>
        <p className="text-muted-foreground">엄선된 공급자가 제안하는 모든 상품</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border text-sm">
        <p className="text-muted-foreground">{products?.length ?? 0}개의 상품</p>
        <div className="flex gap-4">
          <SortLink current={sort} value="latest">최신순</SortLink>
          <SortLink current={sort} value="price_asc">가격 낮은순</SortLink>
          <SortLink current={sort} value="price_desc">가격 높은순</SortLink>
        </div>
      </div>

      {!products || products.length === 0 ? (
        <div className="py-32 text-center text-muted-foreground">
          조건에 맞는 상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="group block">
              <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-4 relative">
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
              <h3 className="text-sm font-semibold mb-1">{p.name}</h3>
              {p.short_description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
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
  current, value, children,
}: { current: string; value: string; children: React.ReactNode }) {
  return (
    <Link
      href={`?sort=${value}`}
      className={current === value ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}
    >
      {children}
    </Link>
  );
}
