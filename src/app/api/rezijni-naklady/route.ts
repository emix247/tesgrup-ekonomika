import { NextRequest, NextResponse } from 'next/server';
import { getOverheadCosts, createOverheadCost, updateOverheadCost, deleteOverheadCost } from '@/lib/queries/overhead';
import { overheadCostSchema } from '@/lib/utils/validation';

export async function GET() {
  return NextResponse.json(await getOverheadCosts());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = overheadCostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = await createOverheadCost(parsed.data);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  const updated = await updateOverheadCost(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  await deleteOverheadCost(id);
  return NextResponse.json({ success: true });
}
