import { NextRequest, NextResponse } from 'next/server';
import { getActualCosts, createActualCost, updateActualCost, deleteActualCost } from '@/lib/queries/costs';
import { actualCostSchema } from '@/lib/utils/validation';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  return NextResponse.json(getActualCosts(projectId));
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = actualCostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = createActualCost(projectId, parsed.data);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  const updated = updateActualCost(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  deleteActualCost(id);
  return NextResponse.json({ success: true });
}
