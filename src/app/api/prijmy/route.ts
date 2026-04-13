import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, getPaymentsSummary } from '@/lib/queries/payments';
import { getSales } from '@/lib/queries/sales';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const projectId = searchParams.get('projectId') || undefined;
  const type = searchParams.get('type');

  if (type === 'summary') {
    const summary = await getPaymentsSummary();
    // Count active contracts
    // We need all sales across projects — no single-project filter
    const { db } = await import('@/lib/db');
    const { sales } = await import('@/lib/db/schema');
    const { inArray } = await import('drizzle-orm');
    const allSales = await db.select().from(sales);
    const activeContracts = allSales.filter(s => ['rezervace', 'smlouva', 'zaloha', 'zaplaceno'].includes(s.status)).length;
    return NextResponse.json({ ...summary, activeContracts });
  }

  const payments = await getAllPayments({ from, to, projectId });
  return NextResponse.json(payments);
}
