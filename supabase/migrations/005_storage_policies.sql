-- ============================================
-- Storage 버킷 업로드 정책 SQL (재실행 안전 버전)
-- 기존 정책을 먼저 지우고 새로 만들어서 "already exists" 에러 방지
-- Supabase → SQL Editor → New query → 붙여넣기 → Run
-- ============================================

-- 기존 정책 제거 (있으면 삭제, 없으면 무시)
drop policy if exists "products_public_read"   on storage.objects;
drop policy if exists "products_auth_insert"   on storage.objects;
drop policy if exists "products_auth_update"   on storage.objects;
drop policy if exists "products_auth_delete"   on storage.objects;
drop policy if exists "licenses_auth_insert"   on storage.objects;
drop policy if exists "licenses_auth_read"     on storage.objects;
drop policy if exists "licenses_auth_update"   on storage.objects;
drop policy if exists "licenses_auth_delete"   on storage.objects;

-- ───────────── products 버킷 (상품 이미지 - 공개) ─────────────
create policy "products_public_read"
on storage.objects for select to public
using ( bucket_id = 'products' );

create policy "products_auth_insert"
on storage.objects for insert to authenticated
with check ( bucket_id = 'products' );

create policy "products_auth_update"
on storage.objects for update to authenticated
using ( bucket_id = 'products' );

create policy "products_auth_delete"
on storage.objects for delete to authenticated
using ( bucket_id = 'products' );

-- ───────────── business-licenses 버킷 (사업자등록증 - 비공개) ─────────────
create policy "licenses_auth_insert"
on storage.objects for insert to authenticated
with check ( bucket_id = 'business-licenses' );

create policy "licenses_auth_read"
on storage.objects for select to authenticated
using ( bucket_id = 'business-licenses' );

create policy "licenses_auth_update"
on storage.objects for update to authenticated
using ( bucket_id = 'business-licenses' );

create policy "licenses_auth_delete"
on storage.objects for delete to authenticated
using ( bucket_id = 'business-licenses' );

-- 확인
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
