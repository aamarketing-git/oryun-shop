import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";
import { ProductDetailSections } from "@/components/product/ProductDetailSections";
import { BuyButton } from "@/components/product/BuyButton";
import { ContactSeller } from "@/components/product/ContactSeller";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, short_description, main_image_url, product_details(meta_title, meta_description)")
    .eq("id", params.id)
    .eq("status", "approved")
    .single();

  if (!product) return { title: "상품을 찾을 수 없음" };

  const detail = Array.isArray(product.product_details) ? product.product_details[0] : product.product_details;
  return {
    title: detail?.meta_title ?? product.name,
    description: detail?.meta_description ?? product.short_description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
      images: product.main_image_url ? [product.main_image_url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select(`
      id, name, short_description, price_krw, stock, main_image_url, inquiry_number,
      category:categories(slug, name),
      seller:sellers!inner(
        id, business_name, contact_phone, contact_kakao, contact_telegram, status,
        bank_name, bank_account_number, bank_account_holder
      ),
      product_details(sections, meta_title, meta_description)
    `)
    .eq("id", params.id)
    .eq("status", "approved")
    .single();

  if (!product) return notFound();

  const detail = Array.isArray(product.product_details) ? product.product_details[0] : product.product_details;
  const seller = Array.isArray(product.seller) ? product.seller[0] : product.seller;

  // 상세페이지 미등록 시 노출 금지 — 기본 카드만 표시
  const hasDetailPage = !!detail && Array.isArray((detail as { sections?: unknown }).sections);

  return (
    <article>
      {/* HERO */}
      <section className="bg-muted">
        <div className="apple-container py-16 md:py-24 text-center animate-fade-in">
          <p className="section-eyebrow mb-4">{product.category?.[0]?.name ?? "오륜"}</p>
          <h1 className="text-hero mb-3">{product.name}</h1>
          {product.short_description && (
            <p className="text-subhead text-muted-foreground mb-6 max-w-2xl mx-auto">
              {product.short_description}
            </p>
          )}
          <p className="text-lg mb-10">
            <span className="text-muted-foreground">{formatKRW(Number(product.price_krw))}부터</span>
          </p>
          {product.main_image_url && (
            <div className="relative w-full max-w-3xl mx-auto aspect-[4/3]">
              <Image
                src={product.main_image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width:768px) 100vw, 1024px"
                className="object-contain"
              />
            </div>
          )}
        </div>
      </section>

      {/* 통일 디자인 상세 섹션 — 관리자 등록분만 */}
      {hasDetailPage ? (
        <ProductDetailSections sections={(detail as { sections: unknown[] }).sections} />
      ) : (
        <section className="apple-container py-16 text-center">
          <p className="text-muted-foreground">
            상세 페이지가 준비 중입니다. 곧 만나보실 수 있어요.
          </p>
        </section>
      )}

      {/* PURCHASE */}
      <section className="bg-muted py-16">
        <div className="apple-container max-w-2xl">
          <div className="bg-background rounded-xl p-8">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-semibold">{product.name}</h2>
              <p className="text-xl font-semibold">{formatKRW(Number(product.price_krw))}</p>
            </div>
            <div className="mb-6 text-sm text-muted-foreground space-y-1">
              <p>공급자: {seller?.business_name}</p>
              <p>재고: {product.stock > 0 ? `${product.stock}개` : "품절"}</p>
            </div>
            <BuyButton
              productId={product.id}
              price={Number(product.price_krw)}
              available={product.stock > 0}
            />
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-3">공급자 문의</h3>
              <ContactSeller
                phone={seller?.contact_phone ?? undefined}
                kakao={seller?.contact_kakao ?? undefined}
                telegram={seller?.contact_telegram ?? undefined}
                inquiryNumber={product.inquiry_number ?? undefined}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="apple-container py-8 text-sm">
        <Link href="/products" className="link-apple">← 상품 목록으로</Link>
      </div>
    </article>
  );
}
