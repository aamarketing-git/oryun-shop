import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  seller: 'bg-blue-100 text-blue-800',
  customer: 'bg-gray-100 text-gray-700',
};

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  seller: '공급자',
  customer: '구매자',
};

export default async function AdminUsersPage() {
  const supabase = createServiceClient();

  // profiles + sellers join (sellers는 user_id로 연결)
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      sellers!sellers_user_id_fkey (
        business_name,
        representative_name,
        status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">회원 관리</h1>
      <p className="mt-2 text-sm text-gray-500">
        가입한 모든 회원 목록입니다. 공급자는 상호명·대표자명도 함께 표시됩니다.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">이메일</th>
              <th className="px-6 py-3">이름</th>
              <th className="px-6 py-3">전화</th>
              <th className="px-6 py-3 text-center">역할</th>
              <th className="px-6 py-3">상호명</th>
              <th className="px-6 py-3">대표자명</th>
              <th className="px-6 py-3">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((u: any) => {
              // sellers는 array(또는 객체)로 올 수 있음 — 첫 번째만
              const seller = Array.isArray(u.sellers) ? u.sellers[0] : u.sellers;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{u.email}</td>
                  <td className="px-6 py-3">{u.name ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{u.phone ?? '—'}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[u.role] ?? 'bg-gray-100'}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {seller?.business_name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {seller?.representative_name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">{formatDate(u.created_at)}</td>
                </tr>
              );
            })}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
