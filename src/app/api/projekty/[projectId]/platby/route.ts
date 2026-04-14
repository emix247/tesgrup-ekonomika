import { NextRequest, NextResponse } from 'next/server';
import { getPaymentsBySale, createPayment, updatePayment, deletePayment, getPaymentsSumBySale } from '@/lib/queries/payments';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const saleId = searchParams.get('saleId');
  if (!saleId) return NextResponse.json({ error: 'saleId required' }, { status: 400 });
  const payments = await getPaymentsBySale(saleId);
  const totalPaid = await getPaymentsSumBySale(saleId);
  return NextResponse.json({ payments, totalPaid });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const { saleId, amount, paymentDate, label, notes } = body;
  if (!saleId || !amount || !paymentDate) {
    return NextResponse.json({ error: 'Chybí saleId, amount nebo paymentDate' }, { status: 400 });
  }
  const payment = await createPayment({ saleId, projectId, amount: parseFloat(amount), paymentDate, label, notes });
  return NextResponse.json(payment, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'Chybí id' }, { status: 400 });
  if (data.amount) data.amount = parseFloat(data.amount);
  const payment = await updatePayment(id, data);
  return NextResponse.json(payment);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Chybí id' }, { status: 400 });
  await deletePayment(id);
  return NextResponse.json({ ok: true });
}
