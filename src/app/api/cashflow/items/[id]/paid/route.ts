import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isPaid } = await req.json();
  const [item] = await db.update(cfItems).set({ isPaid: !!isPaid, paidAt: isPaid ? new Date().toISOString() : null, updatedAt: new Date().toISOString() }).where(eq(cfItems.id, parseInt(id))).returning();
  return NextResponse.json(item);
}
