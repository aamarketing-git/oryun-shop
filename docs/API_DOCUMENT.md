# 오륜쇼핑몰 · API Document

오륜쇼핑몰는 Next.js Server Actions와 Supabase RPC를 조합한 구조입니다. 별도 REST API를 노출하지 않으며, 모든 권한 검증은 RLS + DB Function 내부에서 수행됩니다.

## 인증

Supabase Auth(JWT) 기반. 클라이언트는 쿠키에 세션을 저장하고, 서버 컴포넌트와 Server Action에서 `createClient()`로 인증된 호출을 수행합니다.

```ts
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## DB RPC (PostgreSQL Functions)

모든 RPC는 `supabase/migrations/003_functions.sql`에 정의되어 있습니다.

### 1. `create_order`

```sql
create_order(
  p_product_id   uuid,
  p_quantity     int,
  p_payment_method payment_method,
  p_staking_wallet_address text,
  p_shipping     jsonb
) RETURNS uuid  -- order_id
```

**동작:**
1. `p_staking_wallet_address` 길이 검증 → 없으면 `STAKING_WALLET_REQUIRED`
2. 상품 `SELECT ... FOR UPDATE` (race condition 방지)
3. `status=approved` 확인 → 아니면 `PRODUCT_NOT_AVAILABLE`
4. 재고 검증 → 부족 시 `OUT_OF_STOCK`
5. 현재 환율을 `settings`에서 조회해 `orders.usdt_rate`에 스냅샷
6. `orders` + `order_items` 삽입, 재고 차감
7. `audit_logs`에 기록
8. `order_id` 반환

**오류 코드:**
- `STAKING_WALLET_REQUIRED`
- `PRODUCT_NOT_AVAILABLE`
- `OUT_OF_STOCK`
- `AUTH_REQUIRED`

---

### 2. `submit_txid`

```sql
submit_txid(
  p_order_id uuid,
  p_tx_hash  text,
  p_chain    text  -- 'TRC20' | 'ERC20'
) RETURNS uuid  -- txid_record_id
```

**동작:**
1. 주문 소유 확인
2. `tx_hash` 중복 확인 → 있으면 `TXID_ALREADY_USED`
3. `txid_records` 삽입 (UNIQUE constraint가 race를 잡음)
4. `audit_logs` 기록

**오류 코드:**
- `TXID_ALREADY_USED`
- `ORDER_NOT_PENDING_PAYMENT`
- `FORBIDDEN`

---

### 3. `confirm_payment`

```sql
confirm_payment(p_order_id uuid) RETURNS void
```

권한: 주문 공급자 또는 관리자

**동작:**
- `status: pending_payment → paid`
- `audit_logs` 기록

**오류 코드:**
- `ORDER_NOT_PENDING_PAYMENT`
- `FORBIDDEN`

---

### 4. `register_shipment`

```sql
register_shipment(
  p_order_id        uuid,
  p_method          shipment_method,
  p_courier_company text,
  p_tracking_number text,
  p_direct_note     text
) RETURNS uuid
```

권한: 주문 공급자

**동작:**
- 배송 정보 삽입
- `orders.status: paid → shipping` (직접전달의 경우 `delivered` 옵션 가능)

---

### 5. `approve_seller`

```sql
approve_seller(p_seller_id uuid) RETURNS void
```

권한: 관리자

**동작:**
- `sellers.status: pending → approved`
- `profiles.role: customer → seller` (해당 user_id)
- `audit_logs` 기록

---

### 6. `approve_product`

```sql
approve_product(p_product_id uuid) RETURNS void
```

권한: 관리자

**동작:**
1. `product_details`가 존재하는지 확인 → 없으면 `DETAIL_PAGE_REQUIRED`
2. `products.status: pending → approved`
3. `audit_logs` 기록

**오류 코드:**
- `DETAIL_PAGE_REQUIRED`
- `ADMIN_ONLY`

---

### 7. `update_usdt_rate`

```sql
update_usdt_rate(p_rate numeric) RETURNS void
```

권한: 관리자

**동작:**
- `settings.usdt_krw_rate` 갱신
- `audit_logs` 기록

---

## Server Actions

### `createOrder(formData)`
Path: `src/app/actions/orders.ts`

```ts
formData fields:
- staking_wallet_address  (required)
- product_id
- payment_method          ('bank_transfer' | 'usdt')
- recipient, phone, address, address_detail, postal_code
```

Returns `{ ok: true, orderId } | { ok: false, error }`.

---

### `submitTxid({ orderId, txHash, chain })`

Returns `{ ok?: true; error?: string }`.

서버 사이드에서 정규식 검증 후 RPC 호출:
- TRC20: `^[0-9a-fA-F]{64}$`
- ERC20: `^0x[0-9a-fA-F]{64}$`

---

### `confirmPayment(orderId: string)`

공급자/관리자만. 권한은 DB 함수 내부에서 강제.

---

### `registerShipment({ orderId, method, carrier?, trackingNumber?, note? })`

`method='courier'`면 carrier/trackingNumber 필수, `method='direct'`면 note 권장.

---

### `approveProduct(productId)` / `rejectProduct(productId, reason)` / `hideProduct(productId)`
Path: `src/app/actions/products.ts`

관리자 전용. RLS + 함수 권한 검증.

---

### `saveProductDetail({ productId, existingId?, sections })`

관리자 전용. `sections`는 JSONB 배열. 클라이언트는 화이트리스트된 섹션 타입만 사용 가능:
- `hero`, `feature`, `spec`, `gallery`, `callout`

---

### `createSellerProduct(input)`

공급자 전용. `seller.status=approved`만 허용.

```ts
input: {
  name, description, priceKrw, stock,
  imageUrl, categoryId?, inquiryNumber?, useDirectDelivery?
}
```

생성 시 `status=pending`. 관리자가 상세페이지 작성 + 승인해야 노출.

---

## HTTP Route (Optional)

### `POST /api/txid/verify`

블록체인 API(TronGrid 등)로 TXID 실시간 검증.

```ts
Request: { txidRecordId: string }
Response: {
  ok: boolean,
  fromAddress?: string,
  toAddress?: string,
  amountUsdt?: number,
  blockHeight?: number,
  reason?: string
}
```

`USDT_RECEIVE_ADDRESS_TRC20` 환경변수와 비교해 도착 주소 일치 여부를 확인.

---

## Realtime Channels

Supabase Realtime을 통해 다음 채널을 구독할 수 있습니다 (선택):

- `orders:seller_id=eq.{seller_id}` — 공급자 신규 주문 알림
- `txid_records:order_id=eq.{order_id}` — TXID 제출 알림
- `inquiries:seller_id=eq.{seller_id}` — 문의 알림

---

## 보안 요약

| 위협 | 방어 |
|------|------|
| 권한 우회 | RLS + SECURITY DEFINER 함수 내부 권한 체크 |
| TXID 재사용 | `UNIQUE` 제약 + 함수 내 사전 체크 |
| 재고 race | `SELECT ... FOR UPDATE` 잠금 |
| 가격 조작 | `unit_price_krw`, `usdt_rate` 스냅샷 |
| CSRF | Server Action (Next.js 내장 CSRF 토큰) |
| XSS | React 기본 escape + dangerouslySetInnerHTML 미사용 |
| 직접 SQL | Supabase 클라이언트만 사용, 동적 SQL 없음 |
