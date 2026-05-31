import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyTrc20Txid } from '@/lib/usdt';

// POST /api/txid/verify  { txidRecordId: string }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { txidRecordId } = body as { txidRecordId?: string };
  if (!txidRecordId) return NextResponse.json({ error: 'txidRecordId required' }, { status: 400 });

  const admin = createServiceClient();

  const { data: tx } = await admin
    .from('txid_records')
    .select('*, orders(total_krw, usdt_rate)')
    .eq('id', txidRecordId)
    .maybeSingle();

  if (!tx) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (tx.chain !== 'TRC20') {
    return NextResponse.json({ error: 'auto verification only for TRC20' }, { status: 400 });
  }

  const expectedTo = process.env.USDT_RECEIVE_ADDRESS_TRC20 ?? '';
  const expectedUsdt = Number(tx.orders.total_krw) / Number(tx.orders.usdt_rate);

  const result = await verifyTrc20Txid(tx.tx_hash, expectedTo, expectedUsdt);

  await admin
    .from('txid_records')
    .update({
      verified_at: new Date().toISOString(),
      verification_result: result,
      status: result.ok ? 'verified' : 'failed',
    })
    .eq('id', tx.id);

  return NextResponse.json(result);
}
