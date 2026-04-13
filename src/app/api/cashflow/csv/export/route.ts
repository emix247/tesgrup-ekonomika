import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cfItems, cfProjects } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { format } from 'date-fns';
export const dynamic = 'force-dynamic';
export async function GET() {
  const items = await db.select().from(cfItems).orderBy(asc(cfItems.paymentDate));
  const projects = await db.select().from(cfProjects);
  const pm = Object.fromEntries(projects.map(p => [p.id, p.name]));
  const headers = ['id','type','name','project','amount','paymentDate','certainty','category','note','counterparty','createdAt'];
  const rows = items.map(item => [item.id, item.type, `"${item.name.replace(/"/g,'""')}"`, item.projectId ? `"${(pm[item.projectId]||'').replace(/"/g,'""')}"` : '', item.amount, item.paymentDate, item.certainty, item.category, item.note ? `"${item.note.replace(/"/g,'""')}"` : '', item.counterparty ? `"${item.counterparty.replace(/"/g,'""')}"` : '', item.createdAt]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="cashflow-export-${format(new Date(),'yyyy-MM-dd')}.csv"` } });
}
