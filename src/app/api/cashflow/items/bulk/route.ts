import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { addDays } from 'date-fns';
export async function POST(req: NextRequest) {
  const { ids, shiftDays } = await req.json();
  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 });
  const items = await db.select().from(cfItems).where(inArray(cfItems.id, ids));
  for (const item of items) {
    const newDate = addDays(new Date(item.paymentDate), shiftDays).toISOString().split('T')[0];
    await db.update(cfItems).set({ paymentDate: newDate, updatedAt: new Date().toISOString() }).where(eq(cfItems.id, item.id));
  }
  return NextResponse.json({ updated: items.length });
}
