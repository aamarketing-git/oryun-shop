-- =====================================================================
-- 오륜쇼핑몰 — RLS Policies
-- =====================================================================
-- 핵심 원칙:
--   * customer: 자신의 데이터만 + 승인된 상품만 조회
--   * seller:   자기 상품/주문만 + 자기 정보만
--   * admin:    전체 접근
-- =====================================================================

-- 모든 테이블에 RLS 활성화
alter table profiles enable row level security;
alter table sellers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_details enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table txid_records enable row level security;
alter table shipments enable row level security;
alter table inquiries enable row level security;
alter table settings enable row level security;
alter table audit_logs enable row level security;

-- =====================================================================
-- 헬퍼: 현재 사용자 role 조회 (성능 위해 stable function)
-- =====================================================================
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function is_seller()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'seller')
$$;

create or replace function my_seller_id()
returns uuid language sql stable security definer set search_path = public
as $$
  select id from sellers where user_id = auth.uid() limit 1
$$;

-- =====================================================================
-- profiles
-- =====================================================================
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid() or is_admin());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())  -- 본인은 role 변경 불가
  );

create policy "profiles_admin_all" on profiles
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- sellers
-- =====================================================================
create policy "sellers_select_own" on sellers
  for select using (user_id = auth.uid() or is_admin());

create policy "sellers_select_approved_public" on sellers
  for select using (status = 'approved');  -- 소비자가 상품 페이지에서 공급자 정보 보기

create policy "sellers_insert_self" on sellers
  for insert with check (user_id = auth.uid());

create policy "sellers_update_self" on sellers
  for update using (user_id = auth.uid() and status != 'blocked')
  with check (
    user_id = auth.uid()
    -- 본인은 status, approved_at, approved_by 변경 불가 (별도 admin 전용)
    and status = (select status from sellers where id = sellers.id)
  );

create policy "sellers_admin_all" on sellers
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- categories  (공개 읽기, 관리자만 쓰기)
-- =====================================================================
create policy "categories_public_read" on categories
  for select using (true);

create policy "categories_admin_write" on categories
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- products
-- =====================================================================
-- 공개: 승인된 상품만 모두에게 노출
create policy "products_public_approved" on products
  for select using (status = 'approved');

-- 셀러: 자기 상품 모두 조회/수정 (status 제외 필드)
create policy "products_seller_select" on products
  for select using (seller_id = my_seller_id());

create policy "products_seller_insert" on products
  for insert with check (
    seller_id = my_seller_id()
    and status = 'pending'  -- 신규 등록은 자동으로 pending
  );

create policy "products_seller_update" on products
  for update using (seller_id = my_seller_id())
  with check (
    seller_id = my_seller_id()
    -- 셀러는 status, price_krw 수정 불가 (관리자 전용)
    -- 실제로는 server action에서 별도 필드 화이트리스트로 제어
  );

create policy "products_admin_all" on products
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- product_details  ★ 관리자만 작성 가능 ★
-- =====================================================================
create policy "product_details_public_read" on product_details
  for select using (
    exists (select 1 from products p where p.id = product_id and p.status = 'approved')
  );

create policy "product_details_seller_read" on product_details
  for select using (
    exists (select 1 from products p where p.id = product_id and p.seller_id = my_seller_id())
  );

create policy "product_details_admin_only_write" on product_details
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- orders
-- =====================================================================
create policy "orders_customer_own" on orders
  for select using (customer_id = auth.uid());

create policy "orders_seller_own" on orders
  for select using (seller_id = my_seller_id());

create policy "orders_customer_insert" on orders
  for insert with check (
    customer_id = auth.uid()
    and staking_wallet_address is not null
    and length(staking_wallet_address) > 0
    and status = 'pending_payment'
  );

-- 셀러: 자기 주문만 상태 업데이트 (입금확인, 배송)
create policy "orders_seller_update" on orders
  for update using (seller_id = my_seller_id())
  with check (seller_id = my_seller_id());

create policy "orders_admin_all" on orders
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- order_items
-- =====================================================================
create policy "order_items_via_order_select" on order_items
  for select using (
    exists (
      select 1 from orders o where o.id = order_id
      and (o.customer_id = auth.uid() or o.seller_id = my_seller_id() or is_admin())
    )
  );

create policy "order_items_customer_insert" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- =====================================================================
-- txid_records  (USDT 결제)
-- =====================================================================
create policy "txid_customer_insert" on txid_records
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

create policy "txid_customer_select_own" on txid_records
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

create policy "txid_seller_select" on txid_records
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.seller_id = my_seller_id())
  );

create policy "txid_seller_confirm" on txid_records
  for update using (
    exists (select 1 from orders o where o.id = order_id and o.seller_id = my_seller_id())
  );

create policy "txid_admin_all" on txid_records
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- shipments
-- =====================================================================
create policy "shipments_via_order_select" on shipments
  for select using (
    exists (
      select 1 from orders o where o.id = order_id
      and (o.customer_id = auth.uid() or o.seller_id = my_seller_id() or is_admin())
    )
  );

create policy "shipments_seller_write" on shipments
  for all using (
    exists (select 1 from orders o where o.id = order_id and o.seller_id = my_seller_id())
  )
  with check (
    exists (select 1 from orders o where o.id = order_id and o.seller_id = my_seller_id())
  );

create policy "shipments_admin_all" on shipments
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- inquiries
-- =====================================================================
create policy "inquiries_customer_own" on inquiries
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "inquiries_seller_own" on inquiries
  for select using (seller_id = my_seller_id());

create policy "inquiries_admin_all" on inquiries
  for select using (is_admin());

-- =====================================================================
-- settings  (관리자만 쓰기, 일부 공개 키는 누구나 읽기)
-- =====================================================================
create policy "settings_public_read" on settings
  for select using (
    key in ('usdt_krw_rate', 'site_name', 'maintenance_mode')
  );

create policy "settings_admin_write" on settings
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- audit_logs  (관리자만 조회, 시스템이 insert)
-- =====================================================================
create policy "audit_logs_admin_read" on audit_logs
  for select using (is_admin());
-- INSERT는 SECURITY DEFINER 함수를 통해서만 가능 (002_functions.sql 참조)
