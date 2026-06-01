"use client";

import { useEffect, useState } from "react";

// 다음 우편번호 서비스 (무료, 가입 불필요)
const DAUM_POSTCODE_SCRIPT = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

declare global {
  interface Window {
    daum?: any;
  }
}

/**
 * 한국 주소 검색 컴포넌트
 * - "주소 검색" 버튼 클릭 → 팝업으로 우편번호/주소 자동 입력
 * - 다음(카카오) 우편번호 API (무료, 가입 불필요)
 */
export function AddressSearch({
  postalCodeName = "postal_code",
  addressName = "address",
  addressDetailName = "address_detail",
  defaultPostalCode = "",
  defaultAddress = "",
  defaultAddressDetail = "",
}: {
  postalCodeName?: string;
  addressName?: string;
  addressDetailName?: string;
  defaultPostalCode?: string;
  defaultAddress?: string;
  defaultAddressDetail?: string;
}) {
  const [postalCode, setPostalCode] = useState(defaultPostalCode);
  const [address, setAddress] = useState(defaultAddress);
  const [addressDetail, setAddressDetail] = useState(defaultAddressDetail);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // 스크립트 한 번만 로드
  useEffect(() => {
    if (window.daum?.Postcode) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector(`script[src="${DAUM_POSTCODE_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.src = DAUM_POSTCODE_SCRIPT;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const openSearch = () => {
    if (!scriptLoaded || !window.daum?.Postcode) {
      alert("주소 검색을 준비 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        // 도로명 주소 우선, 없으면 지번 주소
        const selectedAddress = data.roadAddress || data.jibunAddress || "";
        setPostalCode(data.zonecode || "");
        setAddress(selectedAddress);
        // 상세주소 입력 칸으로 포커스 이동
        setTimeout(() => {
          const detailInput = document.querySelector(
            `input[name="${addressDetailName}"]`
          ) as HTMLInputElement | null;
          detailInput?.focus();
        }, 100);
      },
      // 모바일도 보기 좋게
      width: "100%",
      height: "100%",
    }).open();
  };

  return (
    <div className="space-y-2">
      {/* 우편번호 + 검색 버튼 */}
      <div className="flex gap-2 w-full">
        <input
          name={postalCodeName}
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="우편번호"
          readOnly
          className="min-w-0 flex-1 max-w-[140px] px-3 py-2.5 rounded-lg border border-input bg-gray-50 text-sm cursor-default"
        />
        <button
          type="button"
          onClick={openSearch}
          className="flex-shrink-0 rounded-lg bg-[#3182F6] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1B64DA] transition whitespace-nowrap"
        >
          주소 검색
        </button>
      </div>

      {/* 기본 주소 (자동 입력, 읽기 전용) */}
      <input
        name={addressName}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="기본 주소 (검색으로 자동 입력)"
        readOnly
        required
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-gray-50 text-sm cursor-default"
      />

      {/* 상세 주소 (사용자가 직접 입력) */}
      <input
        name={addressDetailName}
        value={addressDetail}
        onChange={(e) => setAddressDetail(e.target.value)}
        placeholder="상세 주소 (동/호수 등)"
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]"
      />
    </div>
  );
}
