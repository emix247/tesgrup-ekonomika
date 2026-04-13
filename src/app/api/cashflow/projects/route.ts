import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfProjects } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  const projects = await db.select().from(cfProjects).orderBy(asc(cfProjects.name));
  return NextResponse.json(projects);
}
export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });
  const [project] = await db.insert(cfProjects).values({ name: name.trim() }).returning();
  return NextResponse.json(project, { status: 201 });
}
