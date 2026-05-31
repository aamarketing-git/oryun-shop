"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "upload" | "url";

/**
 * 이미지 입력 컴포넌트.
 * - 모드 1: 파일 업로드 → Supabase Storage에 자동 업로드 → URL 반환
 * - 모드 2: URL 직접 입력 (이미 업로드된 이미지 URL을 받았을 때)
 *
 * 한글 파일명도 안전하게 처리 (영문으로 자동 변환).
 */
export function ImagePicker({
  value,
  onChange,
  bucket = "products",
  label = "이미지",
}: {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
}) {
  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 검증
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    // 5MB 제한
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();

      // 파일명 안전화: 한글/특수문자 제거, 영문+숫자만
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(safeName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setError("업로드 실패: " + uploadError.message);
        setUploading(false);
        return;
      }

      // Public URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(safeName);

      onChange(publicUrl);
    } catch (err: any) {
      setError("업로드 중 오류: " + (err.message ?? "알 수 없는 오류"));
    } finally {
      setUploading(false);
      // 같은 파일 다시 선택 가능하도록
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearImage = () => {
    onChange("");
    setError(null);
  };

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

      {/* 모드 1: 파일 업로드 */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
            JPG, PNG, WebP 등 이미지 파일 (최대 5MB). 한글 파일명도 안전하게 처리됩니다.
          </p>
        </div>
      )}

      {/* 모드 2: URL 직접 입력 */}
      {mode === "url" && (
        <div>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://...supabase.co/storage/v1/object/public/products/..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            이미 업로드된 이미지의 공개 URL을 붙여넣으세요.
            <br />
            ⚠️ <strong>/sign/</strong>이 들어간 URL은 만료되므로 안 됩니다. <strong>/public/</strong> URL이어야 해요.
          </p>
        </div>
      )}

      {/* 업로드 진행 중 */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          업로드 중...
        </div>
      )}

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 미리보기 */}
      {value && (
        <div className="relative inline-block border border-gray-200 rounded-lg overflow-hidden">
          <img
            src={value}
            alt="미리보기"
            className="max-h-40 max-w-full block"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              setError("이미지를 불러올 수 없어요. URL을 다시 확인해주세요.");
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
