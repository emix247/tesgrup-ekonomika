import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems, cfProjects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
function parseCSVLine(line: string): string[] {
  const result: string[] = []; let current = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1] === '"') { current += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(current); current = ''; }
    else current += c;
  }
  result.push(current); return result;
}
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Soubor nenalezen' }, { status: 400 });
  const text = await file.text();
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: 'Prázdný soubor' }, { status: 400 });
  const headers = parseCSVLine(lines[0]);
  const required = ['type','name','amount','paymentDate','certainty','category'];
  for (const col of required) { if (!headers.includes(col)) return NextResponse.json({ error: `Chybí: ${col}` }, { status: 400 }); }
  let imported = 0; const errors: string[] = []; const now = new Date().toISOString();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim(); if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {}; headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    try {
      const amount = parseFloat(row.amount);
      if (!row.type || !row.name || isNaN(amount) || amount <= 0 || !row.paymentDate || !row.certainty || !row.category) { errors.push(`Řádek ${i+1}: chybí pole`); continue; }
      let projectId: number | null = null;
      if (row.project?.trim()) {
        const existing = await db.select().from(cfProjects).where(eq(cfProjects.name, row.project.trim()));
        if (existing.length > 0) projectId = existing[0].id;
        else { const [proj] = await db.insert(cfProjects).values({ name: row.project.trim() }).returning(); projectId = proj.id; }
      }
      await db.insert(cfItems).values({ type: row.type, name: row.name, projectId, amount, paymentDate: row.paymentDate, certainty: row.certainty, category: row.category, note: row.note || null, counterparty: row.counterparty || null, createdAt: now, updatedAt: now });
      imported++;
    } catch (e) { errors.push(`Řádek ${i+1}: ${String(e)}`); }
  }
  return NextResponse.json({ imported, errors });
}
