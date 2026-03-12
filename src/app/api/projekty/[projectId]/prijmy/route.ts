import { NextRequest, NextResponse } from 'next/server';
import { getRevenueUnits, createRevenueUnit, updateRevenueUnit, deleteRevenueUnit, getRevenueExtras, createRevenueExtra, updateRevenueExtra, deleteRevenueExtra } from '@/lib/queries/revenue';
import { revenueUnitSchema, revenueExtraSchema } from '@/lib/utils/validation';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const units = getRevenueUnits(projectId);
  const extras = getRevenueExtras(projectId);
  return NextResponse.json({ units, extras });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const { type, ...data } = body;

  if (type === 'extra') {
    const parsed = revenueExtraSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const extra = createRevenueExtra(projectId, parsed.data);
    return NextResponse.json(extra, { status: 201 });
  }

  const parsed = revenueUnitSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const unit = createRevenueUnit(projectId, parsed.data);
  return NextResponse.json(unit, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, type, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });

  if (type === 'extra') {
    const updated = updateRevenueExtra(id, data);
    return NextResponse.json(updated);
  }
  const updated = updateRevenueUnit(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });

  if (type === 'extra') {
    deleteRevenueExtra(id);
  } else {
    deleteRevenueUnit(id);
  }
  return NextResponse.json({ success: true });
}
