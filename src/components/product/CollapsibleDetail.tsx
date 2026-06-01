"use client";

import { useState, useRef, useEffect } from "react";

/**
 * 상세페이지 접기/펼치기 래퍼.
 * - 기본: 최대 800px 높이로 잘라서 표시 + 하단에 "펼쳐 보기" 버튼
 * - 펼치면 전체 표시 + "접기" 버튼
 * - 콘텐츠가 800px 이하면 버튼 안 보임 (자동 감지)
 */
export function CollapsibleDetail({
  children,
  collapsedHeight = 800,
}: {
  children: React.ReactNode;
  collapsedHeight?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 콘텐츠가 collapsedHeight보다 큰지 측정 (이미지 로드 후에도 다시 측정)
  useEffect(() => {
    const measure = () => {
      if (contentRef.current) {
        setNeedsCollapse(contentRef.current.scrollHeight > collapsedHeight + 80);
      }
    };
    measure();

    // 이미지 로드되면 다시 측정
    const imgs = contentRef.current?.querySelectorAll("img") ?? [];
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure);
    });

    // resize 시 다시 측정
    window.addEventListener("resize", measure);

    return () => {
      imgs.forEach((img) => img.removeEventListener("load", measure));
      window.removeEventListener("resize", measure);
    };
  }, [collapsedHeight, children]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        style={{
          maxHeight: !needsCollapse || expanded ? "none" : `${collapsedHeight}px`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        {children}
      </div>

      {/* 페이드 그라데이션 (접혀 있을 때) */}
      {needsCollapse && !expanded && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 70%, white 100%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 접기/펼치기 버튼 */}
      {needsCollapse && (
        <div className="text-center py-6">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition shadow-sm"
          >
            {expanded ? (
              <>
                <span>접기</span>
                <span style={{ display: "inline-block", transform: "rotate(180deg)" }}>▾</span>
              </>
            ) : (
              <>
                <span>상세페이지 펼쳐 보기</span>
                <span>▾</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
