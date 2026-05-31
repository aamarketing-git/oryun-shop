import { createServiceClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function AdminTxidsPage() {
  const supabase = createServiceClient();
  const { data: txids } = await supabase
    .from('txid_records')
    .select('*, orders(order_number, total_krw, status)')
    .order('submitted_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <p className="section-eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">TXID 관리</h1>
      <p className="mt-1 text-sm text-gray-500">동일 TXID 재사용 금지가 자동으로 강제됩니다.</p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-3">TXID</th>
              <th className="px-6 py-3">체인</th>
              <th className="px-6 py-3">주문번호</th>
              <th className="px-6 py-3 text-center">상태</th>
              <th className="px-6 py-3">제출일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {txids?.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 max-w-md break-all font-mono text-xs">{t.tx_hash}</td>
                <td className="px-6 py-3">{t.chain}</td>
                <td className="px-6 py-3 font-medium">{t.orders?.order_number}</td>
                <td className="px-6 py-3 text-center">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">{t.status}</span>
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">{formatDate(t.submitted_at)}</td>
              </tr>
            ))}
            {(!txids || txids.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  제출된 TXID가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
