-- =====================================================================
-- 오륜쇼핑몰 — Initial Schema
-- =====================================================================
-- Roles: admin / seller / customer
-- Tables: profiles, sellers, products, product_details, orders, order_items,
--         payments, txid_records, shipments, inquiries, settings, audit_logs
-- =====================================================================

-- Enable extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. profiles  (확장된 auth.users)
-- =====================================================================
create type user_role as enum ('admin', 'seller', 'customer');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  email text unique not null,
  name text,
  phone text,
  staking_wallet_address text,   -- 소비자: 오륜 스테이킹 Wallet (필수)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_role on profiles(role);

-- =====================================================================
-- 2. sellers  (공급자 상세정보 - 승인 워크플로우)
-- =====================================================================
create type seller_status as enum ('pending', 'approved', 'rejected', 'blocked');

create table sellers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  business_name text not null,                  -- 상호명
  representative_name text not null,            -- 대표자 이름
  contact_phone text not null,                  -- 연락처
  contact_kakao text,                           -- 카카오톡
  contact_telegram text,                        -- 텔레그램
  bank_name text,                               -- 은행명
  bank_account_number text,                     -- 계좌번호
  bank_account_holder text,                     -- 예금주
  usdt_wallet_trc20 text,                       -- TRC20 USDT 주소
  usdt_wallet_erc20 text,                       -- ERC20 USDT 주소
  business_license_url text,                    -- 사업자등록증 (선택)
  status seller_status not null default 'pending',
  rejected_reason text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_sellers_status on sellers(status);
create index idx_sellers_user on sellers(user_id);

-- =====================================================================
-- 3. categories
-- =====================================================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  parent_id uuid references categories(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- =====================================================================
-- 4. products
-- =====================================================================
create type product_status as enum ('draft', 'pending', 'approved', 'hidden', 'rejected');

create table products (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references sellers(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  short_description text,
  price_krw bigint not null check (price_krw >= 0),  -- 관리자 수정 가능
  stock int not null default 0 check (stock >= 0),
  main_image_url text,
  status product_status not null default 'pending',
  inquiry_number text,                                -- 공급자 설정 문의번호
  use_direct_delivery boolean default false,          -- 직접전달 옵션
  rejected_reason text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_status on products(status);
create index idx_products_seller on products(seller_id);
create index idx_products_category on products(category_id);

-- =====================================================================
-- 5. product_details  (관리자만 작성하는 통일 상세페이지)
-- =====================================================================
create table product_details (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid unique not null references products(id) on delete cascade,
  -- 템플릿 기반 구조 (JSON으로 통일된 섹션)
  -- 예: [{ "type": "hero", "title": "...", "image": "..." },
  --      { "type": "spec_table", "rows": [...] },
  --      { "type": "feature", "title": "...", "body": "..." }]
  sections jsonb not null default '[]'::jsonb,
  meta_title text,
  meta_description text,
  created_by uuid references profiles(id),       -- 관리자만
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_product_details_product on product_details(product_id);

-- =====================================================================
-- 6. orders
-- =====================================================================
create type order_status as enum (
  'pending_payment',  -- 결제대기
  'paid',             -- 결제완료
  'preparing',        -- 배송준비
  'shipping',         -- 배송중
  'delivered',        -- 배송완료
  'cancelled',        -- 취소
  'refunded'          -- 환불
);

create type payment_method as enum ('bank_transfer', 'usdt');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,                       -- 외부 표기용 (예: ORDER-20250526-0001)
  customer_id uuid not null references profiles(id) on delete restrict,
  seller_id uuid not null references sellers(id) on delete restrict,

  -- 결제 정보
  payment_method payment_method not null,
  total_krw bigint not null check (total_krw >= 0),
  total_usdt numeric(20, 6),                               -- USDT 결제 시
  usdt_rate numeric(20, 6),                                -- 결제 시점 환율 (snapshot)

  -- 필수 입력값
  staking_wallet_address text not null,                    -- 필수: 오륜 스테이킹 Wallet 주소

  -- 배송지
  shipping_recipient text,
  shipping_phone text,
  shipping_address text,
  shipping_address_detail text,
  shipping_postal_code text,

  status order_status not null default 'pending_payment',
  cancelled_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

create index idx_orders_customer on orders(customer_id);
create index idx_orders_seller on orders(seller_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);

-- =====================================================================
-- 7. order_items  (멀티벤더 대비 - 1주문 = 1셀러지만 향후 카트 통합용)
-- =====================================================================
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,                              -- 주문 시점 스냅샷
  unit_price_krw bigint not null,
  quantity int not null check (quantity > 0),
  subtotal_krw bigint not null,
  created_at timestamptz default now()
);

create index idx_order_items_order on order_items(order_id);

-- =====================================================================
-- 8. txid_records  (USDT 결제 TXID 중복 방지)
-- =====================================================================
create type txid_status as enum ('pending', 'confirmed', 'rejected');

create table txid_records (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid unique not null references orders(id) on delete cascade,
  tx_hash text unique not null,                            -- ★ 동일 TXID 재사용 금지 ★
  chain text not null default 'TRC20',                     -- TRC20 / ERC20
  from_address text,
  to_address text not null,
  amount_usdt numeric(20, 6),
  status txid_status not null default 'pending',
  block_height bigint,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  raw_response jsonb,                                      -- 검증 API 원본 응답
  created_at timestamptz default now()
);

create index idx_txid_hash on txid_records(tx_hash);
create index idx_txid_order on txid_records(order_id);
create index idx_txid_status on txid_records(status);

-- =====================================================================
-- 9. shipments
-- =====================================================================
create type shipping_method as enum ('courier', 'direct');

create table shipments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid unique not null references orders(id) on delete cascade,
  method shipping_method not null,                         -- 송장 / 직접전달
  courier_company text,                                    -- 택배사
  tracking_number text,                                    -- 송장번호
  direct_note text,                                        -- 직접전달 메모
  created_by uuid references profiles(id),                 -- 공급자
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_shipments_order on shipments(order_id);

-- =====================================================================
-- 10. inquiries
-- =====================================================================
create type inquiry_channel as enum ('chat', 'phone', 'kakao', 'telegram');

create table inquiries (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  seller_id uuid not null references sellers(id) on delete cascade,
  channel inquiry_channel not null default 'chat',
  subject text,
  message text,                                            -- 채팅 기록 (Realtime 채팅 시 별도 테이블 가능)
  created_at timestamptz default now()
);

create index idx_inquiries_customer on inquiries(customer_id);
create index idx_inquiries_seller on inquiries(seller_id);

-- =====================================================================
-- 11. settings  (Key-Value 시스템 설정)
-- =====================================================================
create table settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

-- 기본 설정 시드
insert into settings (key, value, description) values
  ('usdt_krw_rate', '1500'::jsonb, 'USDT → KRW 기본 환율'),
  ('site_name', '"오륜쇼핑몰"'::jsonb, '사이트 이름'),
  ('maintenance_mode', 'false'::jsonb, '점검 모드');

-- =====================================================================
-- 12. audit_logs  (감사 로그 - 관리자 행위 추적)
-- =====================================================================
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  actor_role user_role,
  action text not null,                                    -- e.g. 'product.approve', 'order.update_price'
  target_table text,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_audit_actor on audit_logs(actor_id);
create index idx_audit_created on audit_logs(created_at desc);

-- =====================================================================
-- Helper: updated_at 자동 갱신 트리거
-- =====================================================================
create or replace function tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tg_profiles_updated   before update on profiles   for each row execute function tg_set_updated_at();
create trigger tg_sellers_updated    before update on sellers    for each row execute function tg_set_updated_at();
create trigger tg_products_updated   before update on products   for each row execute function tg_set_updated_at();
create trigger tg_product_details_updated before update on product_details for each row execute function tg_set_updated_at();
create trigger tg_orders_updated     before update on orders     for each row execute function tg_set_updated_at();
create trigger tg_shipments_updated  before update on shipments  for each row execute function tg_set_updated_at();
create trigger tg_settings_updated   before update on settings   for each row execute function tg_set_updated_at();

-- =====================================================================
-- Helper: 신규 auth.user → profiles 자동 생성
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
