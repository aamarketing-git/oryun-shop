-- =====================================================================
-- 오륜쇼핑몰 — DB Functions (Server-side business logic)
-- =====================================================================

-- =====================================================================
-- 주문번호 생성 (ORDER-YYYYMMDD-XXXX)
-- =====================================================================
create or replace function generate_order_number()
returns text language plpgsql as $$
declare
  today_prefix text := 'ORDER-' || to_char(now(), 'YYYYMMDD');
  seq_num int;
begin
  select coalesce(max(
    cast(split_part(order_number, '-', 3) as int)
  ), 0) + 1
  into seq_num
  from orders
  where order_number like today_prefix || '-%';

  return today_prefix || '-' || lpad(seq_num::text, 4, '0');
end;
$$;

-- =====================================================================
-- 주문 생성 (재고 차감 + 결제 정보 스냅샷 + 환율 잠금)
-- =====================================================================
create or replace function create_order(
  p_product_id uuid,
  p_quantity int,
  p_payment_method payment_method,
  p_staking_wallet_address text,
  p_shipping jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_product products%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_total_krw bigint;
  v_usdt_rate numeric;
  v_total_usdt numeric;
begin
  -- 인증 체크
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- 필수 입력 검증
  if p_staking_wallet_address is null or length(trim(p_staking_wallet_address)) = 0 then
    raise exception 'STAKING_WALLET_REQUIRED: 오륜 스테이킹 Wallet 주소는 필수입니다.';
  end if;

  if p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- 상품 잠금 + 검증
  select * into v_product
  from products
  where id = p_product_id and status = 'approved'
  for update;

  if not found then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  if v_product.stock < p_quantity then
    raise exception 'OUT_OF_STOCK: 재고가 부족합니다. (남은 재고: %)', v_product.stock;
  end if;

  -- 합계 계산
  v_total_krw := v_product.price_krw * p_quantity;

  -- USDT 결제 시 환율 잠금 (settings에서 현재 환율 조회)
  if p_payment_method = 'usdt' then
    select (value::text)::numeric into v_usdt_rate
    from settings where key = 'usdt_krw_rate';
    v_total_usdt := round(v_total_krw / v_usdt_rate, 6);
  end if;

  -- 주문번호 생성
  v_order_number := generate_order_number();

  -- 주문 생성
  insert into orders (
    order_number, customer_id, seller_id,
    payment_method, total_krw, total_usdt, usdt_rate,
    staking_wallet_address,
    shipping_recipient, shipping_phone, shipping_address,
    shipping_address_detail, shipping_postal_code,
    status
  ) values (
    v_order_number, v_user_id, v_product.seller_id,
    p_payment_method, v_total_krw, v_total_usdt, v_usdt_rate,
    p_staking_wallet_address,
    p_shipping->>'recipient', p_shipping->>'phone', p_shipping->>'address',
    p_shipping->>'address_detail', p_shipping->>'postal_code',
    'pending_payment'
  ) returning id into v_order_id;

  -- 주문 항목 생성
  insert into order_items (
    order_id, product_id, product_name, unit_price_krw, quantity, subtotal_krw
  ) values (
    v_order_id, v_product.id, v_product.name, v_product.price_krw, p_quantity, v_total_krw
  );

  -- 재고 차감
  update products set stock = stock - p_quantity where id = v_product.id;

  -- 감사 로그
  insert into audit_logs (actor_id, actor_role, action, target_table, target_id, after_data)
  values (v_user_id, 'customer', 'order.create', 'orders', v_order_id,
          jsonb_build_object('order_number', v_order_number, 'total_krw', v_total_krw));

  return v_order_id;
end;
$$;

-- =====================================================================
-- TXID 등록 (중복 방지 + 결제 상태 업데이트)
-- =====================================================================
create or replace function submit_txid(
  p_order_id uuid,
  p_tx_hash text,
  p_chain text default 'TRC20',
  p_from_address text default null,
  p_to_address text default null,
  p_amount_usdt numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
  v_txid_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  -- 주문 확인 (소비자 본인 또는 관리자)
  select * into v_order from orders where id = p_order_id;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.customer_id != v_user_id and not is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_order.payment_method != 'usdt' then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  if v_order.status != 'pending_payment' then
    raise exception 'ORDER_NOT_PENDING_PAYMENT';
  end if;

  -- TXID 중복 체크 (UNIQUE 제약이 이미 있지만 친절한 에러)
  if exists(select 1 from txid_records where tx_hash = p_tx_hash) then
    raise exception 'TXID_ALREADY_USED: 이미 등록된 TXID입니다.';
  end if;

  -- TXID 레코드 생성
  insert into txid_records (
    order_id, tx_hash, chain, from_address, to_address, amount_usdt, status
  ) values (
    p_order_id, p_tx_hash, p_chain, p_from_address, p_to_address, p_amount_usdt, 'pending'
  ) returning id into v_txid_id;

  -- 감사 로그
  insert into audit_logs (actor_id, actor_role, action, target_table, target_id, after_data)
  values (v_user_id, auth_role(), 'txid.submit', 'txid_records', v_txid_id,
          jsonb_build_object('tx_hash', p_tx_hash));

  return v_txid_id;
end;
$$;

-- =====================================================================
-- 결제 확정 (공급자 또는 관리자가 입금 확인)
-- =====================================================================
create or replace function confirm_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_order from orders where id = p_order_id for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  -- 권한: 셀러 본인 또는 관리자
  if v_order.seller_id != my_seller_id() and not is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_order.status != 'pending_payment' then
    raise exception 'ORDER_NOT_PENDING_PAYMENT';
  end if;

  -- 상태 업데이트
  update orders
  set status = 'paid', paid_at = now()
  where id = p_order_id;

  -- USDT 주문이면 txid_records도 confirmed로
  update txid_records
  set status = 'confirmed', verified_at = now(), verified_by = v_user_id
  where order_id = p_order_id and status = 'pending';

  insert into audit_logs (actor_id, actor_role, action, target_table, target_id)
  values (v_user_id, auth_role(), 'order.confirm_payment', 'orders', p_order_id);
end;
$$;

-- =====================================================================
-- 셀러 승인 (관리자 전용)
-- =====================================================================
create or replace function approve_seller(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_seller sellers%rowtype;
begin
  if not is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  select * into v_seller from sellers where id = p_seller_id for update;
  if not found then raise exception 'SELLER_NOT_FOUND'; end if;

  update sellers
  set status = 'approved', approved_at = now(), approved_by = v_user_id
  where id = p_seller_id;

  -- profiles의 role도 seller로 승격
  update profiles set role = 'seller' where id = v_seller.user_id;

  insert into audit_logs (actor_id, actor_role, action, target_table, target_id)
  values (v_user_id, 'admin', 'seller.approve', 'sellers', p_seller_id);
end;
$$;

-- =====================================================================
-- 상품 승인 (관리자 전용)
-- =====================================================================
create or replace function approve_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  -- 상세페이지 존재 여부 확인 (관리자가 미리 생성했어야 함)
  if not exists(select 1 from product_details where product_id = p_product_id) then
    raise exception 'DETAIL_PAGE_REQUIRED: 상세페이지를 먼저 등록하세요.';
  end if;

  update products
  set status = 'approved', approved_at = now(), approved_by = v_user_id
  where id = p_product_id;

  insert into audit_logs (actor_id, actor_role, action, target_table, target_id)
  values (v_user_id, 'admin', 'product.approve', 'products', p_product_id);
end;
$$;

-- =====================================================================
-- 환율 업데이트 (관리자 전용)
-- =====================================================================
create or replace function update_usdt_rate(p_new_rate numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_value jsonb;
begin
  if not is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  if p_new_rate <= 0 then
    raise exception 'INVALID_RATE';
  end if;

  select value into v_old_value from settings where key = 'usdt_krw_rate';

  update settings
  set value = to_jsonb(p_new_rate), updated_by = v_user_id, updated_at = now()
  where key = 'usdt_krw_rate';

  insert into audit_logs (actor_id, actor_role, action, target_table, before_data, after_data)
  values (v_user_id, 'admin', 'settings.update_usdt_rate', 'settings',
          jsonb_build_object('rate', v_old_value),
          jsonb_build_object('rate', p_new_rate));
end;
$$;

-- =====================================================================
-- 배송 등록 (공급자)
-- =====================================================================
create or replace function register_shipment(
  p_order_id uuid,
  p_method shipping_method,
  p_courier_company text default null,
  p_tracking_number text default null,
  p_direct_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
  v_shipment_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  if v_order.seller_id != my_seller_id() and not is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if v_order.status not in ('paid', 'preparing') then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  -- shipment upsert
  insert into shipments (order_id, method, courier_company, tracking_number, direct_note, created_by)
  values (p_order_id, p_method, p_courier_company, p_tracking_number, p_direct_note, v_user_id)
  on conflict (order_id) do update set
    method = excluded.method,
    courier_company = excluded.courier_company,
    tracking_number = excluded.tracking_number,
    direct_note = excluded.direct_note,
    updated_at = now()
  returning id into v_shipment_id;

  -- 주문 상태 shipping으로
  update orders set status = 'shipping', shipped_at = now() where id = p_order_id;

  insert into audit_logs (actor_id, actor_role, action, target_table, target_id)
  values (v_user_id, auth_role(), 'shipment.register', 'shipments', v_shipment_id);

  return v_shipment_id;
end;
$$;
