// (shop) 라우트 그룹 레이아웃
// 쇼핑 영역(상품/체크아웃/계정)은 루트 레이아웃(헤더·푸터)을 그대로 사용합니다.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
