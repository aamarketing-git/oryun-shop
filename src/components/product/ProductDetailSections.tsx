import Image from "next/image";

/**
 * 관리자가 입력한 sections JSON을 한국 쇼핑몰 스타일 세로 레이아웃으로 렌더링.
 * - 모든 섹션이 화면 너비를 꽉 채우며 세로로 길게 쌓임
 * - 이미지는 원본 비율 유지하면서 한 폭으로 크게 보임
 *
 * 에디터(ProductDetailEditor)가 저장하는 필드명:
 *   - hero:    { title, subtitle, image_url }
 *   - feature: { title, body, image_url, align: 'left'|'right' }
 *   - spec:    { title?, rows: [{ label, value }] }
 *   - gallery: { images: string[] }
 *   - callout: { eyebrow?, title, body? }
 *
 * 이전 포맷(image, image_position)도 호환.
 */

type Section =
  | { type: "detail_image"; url: string }
  | { type: "detail_pdf"; url: string }
  | { type: "hero"; title?: string; subtitle?: string; image_url?: string; image?: string }
  | { type: "feature"; title?: string; body?: string; image_url?: string; image?: string; align?: "left" | "right"; image_position?: "left" | "right" }
  | { type: "spec"; title?: string; rows?: Array<{ label: string; value: string }> }
  | { type: "gallery"; images?: string[] }
  | { type: "callout"; eyebrow?: string; title?: string; body?: string };

export function ProductDetailSections({ sections }: { sections: unknown[] }) {
  return (
    <div className="bg-background">
      {(sections as Section[]).map((sec, idx) => (
        <div key={idx}>{renderSection(sec)}</div>
      ))}
    </div>
  );
}

function renderSection(sec: Section) {
  switch (sec.type) {
    // 단순화된 형식: 큰 이미지 1장
    case "detail_image": {
      const url = (sec as any).url;
      if (!url) return null;
      return (
        <section className="py-4 bg-white">
          <div className="max-w-[900px] mx-auto">
            <img src={url} alt="상품 상세" className="block w-full h-auto" />
          </div>
        </section>
      );
    }

    // 단순화된 형식: PDF
    case "detail_pdf": {
      const url = (sec as any).url;
      if (!url) return null;
      return (
        <section className="py-8 bg-white">
          <div className="max-w-[900px] mx-auto px-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
              <div className="text-5xl mb-3">📄</div>
              <h3 className="text-lg font-bold mb-2">상품 상세 PDF</h3>
              <p className="text-sm text-gray-600 mb-4">
                자세한 상품 정보는 아래 PDF에서 확인하실 수 있습니다.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[14px] bg-[#3182F6] text-white font-semibold px-6 py-3 text-sm hover:bg-[#1B64DA] transition"
              >
                PDF 열기
                <span>→</span>
              </a>
            </div>
            {/* PDF iframe 미리보기 (지원 브라우저에서만 보임) */}
            <div className="mt-4 hidden md:block">
              <iframe
                src={url}
                className="w-full rounded-xl border border-gray-200"
                style={{ height: "800px" }}
                title="상품 상세 PDF"
              />
            </div>
          </div>
        </section>
      );
    }

    case "hero": {
      const img = sec.image_url || sec.image;
      return (
        <section className="py-8 md:py-12 text-center">
          <div className="apple-container">
            {sec.title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{sec.title}</h2>
            )}
            {sec.subtitle && (
              <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto whitespace-pre-line">
                {sec.subtitle}
              </p>
            )}
          </div>
          {img && (
            <div className="w-full mt-4">
              <img
                src={img}
                alt={sec.title ?? ""}
                className="block w-full max-w-[900px] mx-auto h-auto"
              />
            </div>
          )}
        </section>
      );
    }

    case "feature": {
      const img = sec.image_url || sec.image;
      return (
        <section className="py-8 md:py-12">
          <div className="apple-container">
            {sec.title && (
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-center">
                {sec.title}
              </h3>
            )}
            {sec.body && (
              <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto whitespace-pre-line text-center">
                {sec.body}
              </p>
            )}
          </div>
          {img && (
            <div className="w-full mt-4">
              <img
                src={img}
                alt={sec.title ?? ""}
                className="block w-full max-w-[900px] mx-auto h-auto"
              />
            </div>
          )}
        </section>
      );
    }

    case "spec":
      return (
        <section className="bg-muted py-10 md:py-12">
          <div className="apple-container max-w-2xl">
            <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
              {sec.title || "제품 사양"}
            </h3>
            <dl className="divide-y divide-border border-t border-b border-border bg-white rounded-xl overflow-hidden">
              {sec.rows?.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 py-3 px-4 text-sm">
                  <dt className="text-muted-foreground col-span-1">{row.label}</dt>
                  <dd className="col-span-2 break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className="py-8">
          <div className="apple-container max-w-[900px]">
            <div className="flex flex-col gap-3">
              {sec.images?.filter(Boolean).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`gallery-${i}`}
                  className="block w-full h-auto"
                />
              ))}
            </div>
          </div>
        </section>
      );

    case "callout":
      return (
        <section className="py-10 md:py-12 text-center bg-gray-50">
          <div className="apple-container">
            {sec.eyebrow && (
              <p className="section-eyebrow mb-3">{sec.eyebrow}</p>
            )}
            {sec.title && (
              <h3 className="text-xl md:text-2xl font-bold mb-3 max-w-3xl mx-auto">
                {sec.title}
              </h3>
            )}
            {sec.body && (
              <p className="text-base text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">
                {sec.body}
              </p>
            )}
          </div>
        </section>
      );

    default:
      return null;
  }
}
