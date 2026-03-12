import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/queries/projects';
import { projectSchema } from '@/lib/utils/validation';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Projekt nenalezen' }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const existing = await getProjectById(projectId);
  if (!existing) {
    return NextResponse.json({ error: 'Projekt nenalezen' }, { status: 404 });
  }
  const body = await request.json();
  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await updateProject(projectId, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const existing = await getProjectById(projectId);
  if (!existing) {
    return NextResponse.json({ error: 'Projekt nenalezen' }, { status: 404 });
  }
  await deleteProject(projectId);
  return NextResponse.json({ success: true });
}
