# 오륜쇼핑몰 — Multi-Vendor Marketplace

토스(Toss) 스타일의 미니멀한 멀티벤더 쇼핑 플랫폼입니다. (Pretendard 폰트, 토스 블루 #3182F6, 홈 상품 우선 + 카테고리 햄버거 메뉴)
관리자(Admin) ・ 공급자(Seller) ・ 소비자(Customer) 3-역할 구조로 운영됩니다.

---

## 🏗 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| Framework | **Next.js 14 (App Router)** | SSR/ISR 기반 SEO 최적화, 서버 액션, 미들웨어 권한 분리 |
| Language | **TypeScript** | 타입 안전성, 대규모 협업, DB 스키마와의 타입 동기화 |
| Styling | **TailwindCSS + shadcn/ui** | 디자인 일관성, 변경 비용 최소화, 토스풍 미니멀 |
| Backend | **Supabase (Postgres + Auth + Storage + Realtime)** | RLS로 역할별 데이터 격리, 운영 부담 최소화 |
| Auth | **Supabase Auth (JWT + Cookie)** | SSR 친화, 미들웨어에서 세션 검증 가능 |
| Deploy | **Vercel + Supabase** | Zero-Ops 배포, Edge 네트워크, 자동 SSL |
| 결제 | **Bank Transfer + USDT (TRC20/ERC20)** | 별도 PG 의존성 제거, 직접 정산 구조 |

### 왜 HTML/Spreadsheet보다 안정적인가

| 항목 | HTML/Spreadsheet | 오륜쇼핑몰 (Next.js + Supabase) |
|------|------------------|----------------------------------|
| 동시성 제어 | ❌ 마지막 저장이 이전 덮어쓰기 | ✅ Postgres 트랜잭션, Optimistic Lock |
| 권한 | ❌ 시트 공유 = 전체 노출 | ✅ RLS로 row 단위 격리 |
| TXID 중복방지 | ❌ 수동 확인 | ✅ DB UNIQUE 제약 + 인덱스 |
| 재고 정합성 | ❌ Race condition 발생 | ✅ Server Action + DB-level constraint |
| 감사 | ❌ 변경 이력 추적 어려움 | ✅ `audit_logs` 테이블 자동 기록 |
| 확장성 | ❌ 수천 row에서 성능 저하 | ✅ 인덱스 + 페이지네이션으로 수백만 row 처리 |
| SEO/모바일 | ❌ 검색 노출 불가 | ✅ SSR, OG 메타, 반응형 |

---

## 📁 폴더 구조

```
oryun-shop/
├── src/
│   ├── app/
│   │   ├── (shop)/                 # 소비자 영역 (그룹 라우트)
│   │   │   ├── page.tsx            # 메인
│   │   │   ├── products/
│   │   │   │   ├── page.tsx        # 카테고리/리스트
│   │   │   │   └── [id]/page.tsx   # 상세
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   └── account/page.tsx    # 마이페이지
│   │   ├── seller/                 # 공급자 센터
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   └── orders/page.tsx
│   │   ├── admin/                  # 관리자 센터
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sellers/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── orders/page.tsx
│   │   │   ├── txids/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── api/
│   │   │   ├── orders/route.ts
│   │   │   ├── txid/verify/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 원자 컴포넌트
│   │   ├── layout/                 # Header, Footer, Nav
│   │   ├── product/                # ProductCard, ProductDetail
│   │   ├── checkout/               # PaymentForm, WalletInput
│   │   ├── admin/
│   │   └── seller/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # 브라우저 클라이언트
│   │   │   ├── server.ts           # 서버 클라이언트
│   │   │   └── middleware.ts       # 미들웨어용
│   │   ├── auth.ts                 # 인증 헬퍼
│   │   ├── rbac.ts                 # 권한 체크
│   │   ├── usdt.ts                 # USDT 환율/검증
│   │   └── utils.ts
│   ├── types/
│   │   └── database.ts             # Supabase 자동 생성 타입
│   └── middleware.ts               # Next.js 미들웨어
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_functions.sql
│   │   └── 004_seed.sql
│   └── config.toml
├── docs/
│   ├── ERD.md
│   ├── API_DOCUMENT.md
│   └── USER_MANUAL.md
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 설치 & 실행

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어 Supabase URL, ANON KEY, SERVICE_ROLE_KEY 입력

# 3. Supabase DB 마이그레이션
pnpm supabase db push

# 4. 개발 서버
pnpm dev
# http://localhost:3000
```

## 🔑 환경변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # 서버 전용

NEXT_PUBLIC_SITE_URL=https://oryun.shop

# USDT 결제용 (운영자 지갑)
USDT_RECEIVE_ADDRESS_TRC20=TXXXXXXXXXXXX
USDT_RECEIVE_ADDRESS_ERC20=0xXXXXXXXX
TRONGRID_API_KEY=                          # TXID 검증용 (선택)

# 환율 기본값
DEFAULT_USDT_KRW_RATE=1500
```

---

## 🌐 배포 (Vercel + Supabase)

### Supabase
1. supabase.com → New Project
2. SQL Editor → `supabase/migrations/*.sql` 순서대로 실행
3. Storage → `products`, `documents` 버킷 생성 (`products`는 public, `documents`는 private)
4. Authentication → Email Provider 활성화

### Vercel
1. GitHub 저장소 연결
2. Environment Variables에 `.env.local` 값 입력
3. Deploy → 자동 SSL & Edge 배포

---

## 📚 문서

- [`docs/ERD.md`](docs/ERD.md) — 데이터베이스 ERD
- [`docs/API_DOCUMENT.md`](docs/API_DOCUMENT.md) — API 명세
- [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) — 관리자/공급자/소비자용 매뉴얼

---

## 📜 라이센스

MIT License — 자유롭게 수정 및 상업적 이용 가능

