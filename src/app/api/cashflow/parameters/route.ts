import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfParameters } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
export const dynamic = 'force-dynamic';
export async function GET() {
  const params = await db.select().from(cfParameters);
  const result: Record<string, string> = {};
  for (const p of params) result[p.key] = p.value;
  return NextResponse.json(result);
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.select().from(cfParameters).where(eq(cfParameters.key, key));
    if (existing.length > 0) await db.update(cfParameters).set({ value: String(value) }).where(eq(cfParameters.key, key));
    else await db.insert(cfParameters).values({ key, value: String(value) });
  }
  return NextResponse.json({ ok: true });
}
