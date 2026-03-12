import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, createProject } from '@/lib/queries/projects';
import { projectSchema } from '@/lib/utils/validation';

export async function GET() {
  const data = getAllProjects();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const project = createProject(parsed.data);
  return NextResponse.json(project, { status: 201 });
}
