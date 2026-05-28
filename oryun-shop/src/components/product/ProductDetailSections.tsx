import Image from "next/image";

/**
 * 관리자가 입력한 sections JSON을 통일된 디자인으로 렌더링.
 * 허용된 type만 처리하여 디자인 깨짐을 방지.
 *
 * 지원 타입:
 *   - "hero":      { title, subtitle, image }
 *   - "feature":   { title, body, image?, image_position? "left"|"right" }
 *   - "spec":      { rows: [{ label, value }] }
 *   - "gallery":   { images: string[] }
 *   - "callout":   { body }
 */

type Section =
  | { type: "hero"; title?: string; subtitle?: string; image?: string }
  | { type: "feature"; title?: string; body?: string; image?: string; image_position?: "left" | "right" }
  | { type: "spec"; rows?: Array<{ label: string; value: string }> }
  | { type: "gallery"; images?: string[] }
  | { type: "callout"; body?: string };

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
    case "hero":
      return (
        <section className="apple-container py-20 text-center">
          {sec.title && <h2 className="text-headline mb-3">{sec.title}</h2>}
          {sec.subtitle && (
            <p className="text-subhead text-muted-foreground mb-8 max-w-2xl mx-auto">
              {sec.subtitle}
            </p>
          )}
          {sec.image && (
            <div className="relative w-full max-w-3xl mx-auto aspect-[4/3]">
              <Image src={sec.image} alt={sec.title ?? ""} fill className="object-contain" />
            </div>
          )}
        </section>
      );

    case "feature": {
      const reverse = sec.image_position === "left";
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
            {sec.image && (
              <div className="relative aspect-square">
                <Image src={sec.image} alt={sec.title ?? ""} fill className="object-contain" />
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
            <h3 className="text-headline mb-8 text-center">제품 사양</h3>
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
            {sec.images?.map((src, i) => (
              <div key={i} className="relative aspect-square bg-muted rounded-xl overflow-hidden">
                <Image src={src} alt={`gallery-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      );

    case "callout":
      return (
        <section className="apple-container py-16 text-center">
          <p className="text-2xl md:text-3xl font-semibold tracking-tight max-w-3xl mx-auto">
            {sec.body}
          </p>
        </section>
      );

    default:
      return null;
  }
}
