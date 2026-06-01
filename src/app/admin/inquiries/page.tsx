import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminInquiriesPage() {
  const supabase = createServiceClient();
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, products(name), profiles!inquiries_customer_id_fkey(email), sellers(business_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">문의 조회</h1>
      <p className="mt-1 text-sm text-gray-500">
        실제 대화는 카카오톡·전화·텔레그램 등 외부 채널에서 진행됩니다. 메타데이터만 조회 가능합니다.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">상품</th>
              <th className="px-6 py-3">고객</th>
              <th className="px-6 py-3">공급자</th>
              <th className="px-6 py-3">채널</th>
              <th className="px-6 py-3">메시지</th>
              <th className="px-6 py-3">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inquiries?.map((i: any) => (
              <tr key={i.id}>
                <td className="px-6 py-3">{i.products?.name}</td>
                <td className="px-6 py-3 text-gray-600">{i.profiles?.email}</td>
                <td className="px-6 py-3 text-gray-600">{i.sellers?.business_name}</td>
                <td className="px-6 py-3">{i.channel}</td>
                <td className="px-6 py-3 max-w-md truncate text-gray-600">{i.message ?? '—'}</td>
                <td className="px-6 py-3 text-xs text-gray-500">{formatDate(i.created_at)}</td>
              </tr>
            ))}
            {(!inquiries || inquiries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  문의 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
