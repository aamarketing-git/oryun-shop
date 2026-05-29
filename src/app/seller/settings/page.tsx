import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SellerSettingsForm } from '@/components/seller/SellerSettingsForm';

const STATUS_LABEL: Record<string, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절',
  blocked: '차단',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  blocked: 'bg-gray-200 text-gray-700',
};

export default async function SellerSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!seller) redirect('/');

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">설정</h1>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-500">계정 상태:</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLOR[seller.status] ?? 'bg-gray-100'
          }`}
        >
          {STATUS_LABEL[seller.status] ?? seller.status}
        </span>
      </div>

      {seller.status === 'rejected' && seller.rejected_reason && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">관리자가 가입을 거절했습니다.</p>
          <p className="mt-1">사유: {seller.rejected_reason}</p>
          <p className="mt-2 text-xs">정보를 수정한 후 관리자에게 재검토를 요청하세요.</p>
        </div>
      )}

      <div className="mt-8">
        <SellerSettingsForm seller={seller} />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        ℹ️ 본인의 정보는 직접 수정할 수 있습니다. 수정 사항은 즉시 반영됩니다.
        다만, 계정 상태(승인/거절)는 관리자가 관리합니다.
      </p>
    </div>
  );
}
