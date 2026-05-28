import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export default async function SellerInquiriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single();
  if (!seller) redirect('/');

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, products(name), profiles!inquiries_customer_id_fkey(email, phone)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <p className="section-eyebrow">Seller</p>
      <h1 className="mt-2 text-3xl font-semibold">문의 내역</h1>

      <div className="mt-8 space-y-3">
        {inquiries?.map((i: any) => (
          <div key={i.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">{i.products?.name}</p>
              <span className="text-xs text-gray-500">{formatDate(i.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{i.message ?? '—'}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>고객: {i.profiles?.email}</span>
              {i.profiles?.phone && <span>· 전화: {i.profiles.phone}</span>}
              <span>· 채널: {i.channel}</span>
            </div>
          </div>
        ))}
        {(!inquiries || inquiries.length === 0) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
            문의가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
