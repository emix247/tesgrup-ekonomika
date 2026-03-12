import { NextRequest, NextResponse } from 'next/server';
import { getOverheadAllocations, upsertOverheadAllocation, deleteOverheadAllocation } from '@/lib/queries/overhead';
import { overheadAllocationSchema } from '@/lib/utils/validation';

export async function GET() {
  return NextResponse.json(getOverheadAllocations());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = overheadAllocationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = upsertOverheadAllocation(parsed.data);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  const updated = upsertOverheadAllocation({ id, ...data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  deleteOverheadAllocation(id);
  return NextResponse.json({ success: true });
}
