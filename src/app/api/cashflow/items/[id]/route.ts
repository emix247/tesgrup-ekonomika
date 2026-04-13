import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(cfItems).where(eq(cfItems.id, parseInt(id)));
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const u: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.type) u.type = body.type;
  if (body.name) u.name = body.name;
  if (body.projectId !== undefined) u.projectId = body.projectId ? parseInt(body.projectId) : null;
  if (body.amount !== undefined) u.amount = parseFloat(body.amount);
  if (body.paymentDate) u.paymentDate = body.paymentDate;
  if (body.certainty) u.certainty = body.certainty;
  if (body.category) u.category = body.category;
  if (body.note !== undefined) u.note = body.note || null;
  if (body.counterparty !== undefined) u.counterparty = body.counterparty || null;
  const [item] = await db.update(cfItems).set(u).where(eq(cfItems.id, parseInt(id))).returning();
  return NextResponse.json(item);
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(cfItems).where(eq(cfItems.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
