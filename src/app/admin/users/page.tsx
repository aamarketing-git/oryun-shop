import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  seller: 'bg-blue-100 text-blue-800',
  customer: 'bg-gray-100 text-gray-700',
};

export default async function AdminUsersPage() {
  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">회원 관리</h1>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">이메일</th>
              <th className="px-6 py-3">이름</th>
              <th className="px-6 py-3">전화</th>
              <th className="px-6 py-3 text-center">역할</th>
              <th className="px-6 py-3">Staking Wallet</th>
              <th className="px-6 py-3">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{u.email}</td>
                <td className="px-6 py-3">{u.full_name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-600">{u.phone ?? '—'}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${ROLE_COLOR[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-xs text-gray-600">
                  {u.staking_wallet_address ? u.staking_wallet_address.slice(0, 16) + '…' : '—'}
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
