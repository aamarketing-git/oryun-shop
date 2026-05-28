import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SellerSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('*').eq('user_id', user.id).single();
  if (!seller) redirect('/');

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">설정</h1>

      <div className="mt-8 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">사업자 정보</h2>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-gray-500">상호명</dt>
            <dd>{seller.business_name}</dd>
            <dt className="text-gray-500">대표자명</dt>
            <dd>{seller.representative_name}</dd>
            <dt className="text-gray-500">연락처</dt>
            <dd>{seller.contact_phone}</dd>
            <dt className="text-gray-500">상태</dt>
            <dd>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">
                {seller.status}
              </span>
            </dd>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">정산 정보</h2>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-gray-500">은행</dt>
            <dd>{seller.bank_name ?? '—'}</dd>
            <dt className="text-gray-500">계좌</dt>
            <dd className="font-mono">{seller.bank_account ?? '—'}</dd>
            <dt className="text-gray-500">예금주</dt>
            <dd>{seller.bank_holder ?? '—'}</dd>
            <dt className="text-gray-500">USDT (TRC20)</dt>
            <dd className="font-mono break-all">{seller.usdt_address_trc20 ?? '—'}</dd>
            <dt className="text-gray-500">USDT (ERC20)</dt>
            <dd className="font-mono break-all">{seller.usdt_address_erc20 ?? '—'}</dd>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">문의 연락처</h2>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-3 text-sm">
            <dt className="text-gray-500">카카오톡</dt>
            <dd>{seller.contact_kakao ?? '—'}</dd>
            <dt className="text-gray-500">텔레그램</dt>
            <dd>{seller.contact_telegram ?? '—'}</dd>
          </dl>
        </section>

        <p className="text-xs text-gray-500">
          ℹ️ 정보 수정은 관리자에게 요청해 주세요. 보안상 일부 항목은 관리자만 수정할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
