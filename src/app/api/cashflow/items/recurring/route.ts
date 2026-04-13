import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems } from '@/lib/db/schema';
import { addDays, addMonths } from 'date-fns';
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name, amount, certainty, category, projectId, note, counterparty, startDate, frequency, occurrences } = body;
  if (!type || !name || !amount || !certainty || !category || !startDate || !frequency || !occurrences) return NextResponse.json({ error: 'Chybí povinné pole' }, { status: 400 });
  if (occurrences < 2 || occurrences > 24) return NextResponse.json({ error: 'Počet 2-24' }, { status: 400 });
  const dates: string[] = [];
  const base = new Date(startDate);
  for (let i = 0; i < occurrences; i++) {
    let d: Date;
    if (frequency === 'weekly') d = addDays(base, i * 7);
    else if (frequency === 'biweekly') d = addDays(base, i * 14);
    else if (frequency === 'monthly') d = addMonths(base, i);
    else d = addMonths(base, i * 3);
    dates.push(d.toISOString().split('T')[0]);
  }
  const now = new Date().toISOString();
  const created = [];
  for (let idx = 0; idx < dates.length; idx++) {
    const [item] = await db.insert(cfItems).values({ type, name: `${name} (${idx+1}/${occurrences})`, amount: parseFloat(amount), paymentDate: dates[idx], certainty, category, projectId: projectId ? parseInt(projectId) : null, note: note || null, counterparty: counterparty || null, createdAt: now, updatedAt: now }).returning();
    created.push(item);
  }
  return NextResponse.json({ created: created.length, items: created }, { status: 201 });
}
