import Image from "next/image";

/**
 * 관리자가 입력한 sections JSON을 통일된 디자인으로 렌더링.
 *
 * 에디터(ProductDetailEditor)가 저장하는 필드명에 맞춰 읽음:
 *   - hero:    { title, subtitle, image_url }
 *   - feature: { title, body, image_url, align: 'left'|'right' }
 *   - spec:    { title?, rows: [{ label, value }] }
 *   - gallery: { images: string[] }
 *   - callout: { eyebrow?, title, body? }
 *
 * 이전 포맷(image, image_position)도 호환되도록 둘 다 받음.
 */

type Section =
  | { type: "hero"; title?: string; subtitle?: string; image_url?: string; image?: string }
  | { type: "feature"; title?: string; body?: string; image_url?: string; image?: string; align?: "left" | "right"; image_position?: "left" | "right" }
  | { type: "spec"; title?: string; rows?: Array<{ label: string; value: string }> }
  | { type: "gallery"; images?: string[] }
  | { type: "callout"; eyebrow?: string; title?: string; body?: string };

export function ProductDetailSections({ sections }: { sections: unknown[] }) {
  return (
    <div className="bg-background">
      {(sections as Section[]).map((sec, idx) => (
        <div key={idx} className="animate-fade-in">
          {renderSection(sec)}
        </div>
      ))}
    </div>
  );
}

function renderSection(sec: Section) {
  switch (sec.type) {
    case "hero": {
      const img = sec.image_url || sec.image;
      return (
        <section className="apple-container py-20 text-center">
          {sec.title && <h2 className="text-headline mb-3">{sec.title}</h2>}
          {sec.subtitle && (
            <p className="text-subhead text-muted-foreground mb-8 max-w-2xl mx-auto">
              {sec.subtitle}
            </p>
          )}
          {img && (
            <div className="relative w-full max-w-3xl mx-auto aspect-[4/3]">
              <Image src={img} alt={sec.title ?? ""} fill className="object-contain" unoptimized />
            </div>
          )}
        </section>
      );
    }

    case "feature": {
      const img = sec.image_url || sec.image;
      const reverse = (sec.align ?? sec.image_position) === "left";
      return (
        <section className="apple-container py-20">
          <div className={`grid md:grid-cols-2 gap-12 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div>
              {sec.title && <h3 className="text-headline mb-4">{sec.title}</h3>}
              {sec.body && (
                <p className="text-subhead text-muted-foreground whitespace-pre-line">
                  {sec.body}
                </p>
              )}
            </div>
            {img && (
              <div className="relative aspect-square">
                <Image src={img} alt={sec.title ?? ""} fill className="object-contain" unoptimized />
              </div>
            )}
          </div>
        </section>
      );
    }

    case "spec":
      return (
        <section className="bg-muted py-20">
          <div className="apple-container max-w-2xl">
            <h3 className="text-headline mb-8 text-center">{sec.title || "제품 사양"}</h3>
            <dl className="divide-y divide-border border-t border-b border-border">
              {sec.rows?.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 py-3 text-sm">
                  <dt className="text-muted-foreground col-span-1">{row.label}</dt>
                  <dd className="col-span-2">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className="apple-container py-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sec.images?.filter(Boolean).map((src, i) => (
              <div key={i} className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                <Image src={src} alt={`gallery-${i}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </section>
      );

    case "callout":
      return (
        <section className="apple-container py-16 text-center">
          {sec.eyebrow && (
            <p className="section-eyebrow mb-3">{sec.eyebrow}</p>
          )}
          {sec.title && (
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight max-w-3xl mx-auto mb-3">
              {sec.title}
            </h3>
          )}
          {sec.body && (
            <p className="text-subhead text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">
              {sec.body}
            </p>
          )}
        </section>
      );

    default:
      return null;
  }
}
