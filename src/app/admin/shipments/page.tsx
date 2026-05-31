import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminShipmentsPage() {
  const supabase = createServiceClient();
  const { data: shipments } = await supabase
    .from('shipments')
    .select('*, orders(order_number, status, sellers(business_name))')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">배송 관리</h1>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">주문번호</th>
              <th className="px-6 py-3">공급자</th>
              <th className="px-6 py-3">방식</th>
              <th className="px-6 py-3">택배사</th>
              <th className="px-6 py-3">송장번호</th>
              <th className="px-6 py-3">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shipments?.map((s: any) => (
              <tr key={s.id}>
                <td className="px-6 py-3 font-medium">{s.orders?.order_number}</td>
                <td className="px-6 py-3 text-gray-600">{s.orders?.sellers?.business_name}</td>
                <td className="px-6 py-3">{s.method === 'courier' ? '택배' : '직접 전달'}</td>
                <td className="px-6 py-3 text-gray-600">{s.carrier ?? '—'}</td>
                <td className="px-6 py-3 font-mono text-xs">{s.tracking_number ?? '—'}</td>
                <td className="px-6 py-3 text-xs text-gray-500">{formatDate(s.created_at)}</td>
              </tr>
            ))}
            {(!shipments || shipments.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  배송 등록 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
