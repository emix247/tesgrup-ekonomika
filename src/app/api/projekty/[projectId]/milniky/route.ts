import { NextRequest, NextResponse } from 'next/server';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '@/lib/queries/milestones';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const data = await getMilestones(projectId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const milestone = await createMilestone(projectId, body);
  return NextResponse.json(milestone, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const milestone = await updateMilestone(id, data);
  return NextResponse.json(milestone);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await deleteMilestone(id);
  return NextResponse.json({ ok: true });
}
