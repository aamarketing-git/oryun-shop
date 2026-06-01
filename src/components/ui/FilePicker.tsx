"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "upload" | "url";

/**
 * 파일 입력 컴포넌트 (이미지 + PDF).
 * - 파일 업로드 → Supabase Storage → URL 반환
 * - URL 직접 입력
 * - accept로 지원 파일 타입 제한 가능
 */
export function FilePicker({
  value,
  onChange,
  bucket = "products",
  accept = "image/*,application/pdf",
  label = "파일",
  maxSizeMB = 10,
}: {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
}) {
  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 크기 체크
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(safeName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setError("업로드 실패: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(safeName);

      onChange(publicUrl);
    } catch (err: any) {
      setError("업로드 중 오류: " + (err.message ?? "알 수 없는 오류"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    onChange("");
    setError(null);
  };

  // 파일 타입 판별
  const isPdf = value && (
    value.toLowerCase().endsWith(".pdf") ||
    value.includes(".pdf?")
  );
  const isImage = value && /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(value);

  return (
    <div className="space-y-3">
      {/* 모드 전환 탭 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
            mode === "upload"
              ? "bg-white text-[#3182F6] font-semibold shadow-sm"
              : "text-gray-600"
          }`}
        >
          📤 파일 업로드
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
            mode === "url"
              ? "bg-white text-[#3182F6] font-semibold shadow-sm"
              : "text-gray-600"
          }`}
        >
          🔗 URL 입력
        </button>
      </div>

      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-600
              file:mr-3 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-[#3182F6] file:text-white
              hover:file:bg-[#1B64DA]
              file:cursor-pointer cursor-pointer
              disabled:opacity-50"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            {accept.includes("pdf")
              ? `이미지(JPG/PNG/WebP) 또는 PDF · 최대 ${maxSizeMB}MB`
              : `이미지 파일 · 최대 ${maxSizeMB}MB`}
          </p>
        </div>
      )}

      {mode === "url" && (
        <div>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... 공개 URL"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            이미 업로드된 파일의 공개 URL을 붙여넣으세요. <strong>/public/</strong> URL이어야 해요.
          </p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          업로드 중...
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 미리보기 */}
      {value && (
        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          {isImage ? (
            <div className="relative inline-block">
              <img
                src={value}
                alt="미리보기"
                className="max-h-48 max-w-full block rounded"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          ) : isPdf ? (
            <div className="flex items-center gap-3">
              <div className="text-3xl">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">PDF 파일</p>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#3182F6] hover:underline truncate block"
                >
                  미리보기 열기 →
                </a>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ 제거
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-3xl">📎</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{value}</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ 제거
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
