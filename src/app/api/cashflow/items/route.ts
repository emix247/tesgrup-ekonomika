import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems, cfProjects } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  const items = await db.select().from(cfItems).orderBy(asc(cfItems.paymentDate));
  const projects = await db.select().from(cfProjects);
  const pm = Object.fromEntries(projects.map(p => [p.id, p.name]));
  return NextResponse.json(items.map(i => ({ ...i, project: i.projectId ? { id: i.projectId, name: pm[i.projectId] || '' } : null })));
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name, projectId, amount, paymentDate, certainty, category, note, counterparty } = body;
  if (!type || !name || !amount || !paymentDate || !certainty || !category) return NextResponse.json({ error: 'Chybí povinné pole' }, { status: 400 });
  const now = new Date().toISOString();
  const [item] = await db.insert(cfItems).values({ type, name, projectId: projectId ? parseInt(projectId) : null, amount: parseFloat(amount), paymentDate, certainty, category, note: note || null, counterparty: counterparty || null, createdAt: now, updatedAt: now }).returning();
  return NextResponse.json(item, { status: 201 });
}
