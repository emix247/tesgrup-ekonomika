import { NextRequest, NextResponse } from 'next/server';
import { getSales, createSale, updateSale, deleteSale } from '@/lib/queries/sales';
import { saleSchema } from '@/lib/utils/validation';

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  return NextResponse.json(await getSales(projectId));
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const body = await request.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const item = await createSale(projectId, parsed.data);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  const updated = await updateSale(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je povinné' }, { status: 400 });
  await deleteSale(id);
  return NextResponse.json({ success: true });
}
