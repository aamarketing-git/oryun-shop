-- =====================================================================
-- 오륜쇼핑몰 — Seed Data
-- =====================================================================

-- 기본 카테고리 (Apple Store처럼 간결하게)
insert into categories (slug, name, sort_order) values
  ('digital', '디지털', 1),
  ('lifestyle', '라이프스타일', 2),
  ('accessories', '액세서리', 3),
  ('staking', '스테이킹', 4)
on conflict (slug) do nothing;

-- =====================================================================
-- 첫 관리자 계정 생성 안내
-- =====================================================================
-- ⚠️ Supabase Dashboard → Authentication에서 admin@oryun.shop 등 계정 생성 후
--    아래 쿼리로 role을 admin으로 변경하세요:
--
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@oryun.shop';
-- =====================================================================
