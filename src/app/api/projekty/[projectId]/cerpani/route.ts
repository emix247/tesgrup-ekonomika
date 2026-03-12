import { NextRequest, NextResponse } from 'next/server';
import { getDrawdowns, createDrawdown, updateDrawdown, deleteDrawdown } from '@/lib/queries/drawdowns';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = getDrawdowns(projectId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const drawdown = createDrawdown(projectId, body);
  return NextResponse.json(drawdown, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = updateDrawdown(id, data);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  deleteDrawdown(id);
  return NextResponse.json({ ok: true });
}
