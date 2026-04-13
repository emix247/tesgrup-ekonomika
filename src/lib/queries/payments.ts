import { db } from '@/lib/db';
import { payments, sales, revenueUnits, projects } from '@/lib/db/schema';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getPaymentsBySale(saleId: string) {
  return db.select().from(payments).where(eq(payments.saleId, saleId)).orderBy(desc(payments.paymentDate));
}

export async function getPaymentsByProject(projectId: string) {
  return db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(desc(payments.paymentDate));
}

export async function getAllPayments(filters?: { from?: string; to?: string; projectId?: string }) {
  const allPayments = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      label: payments.label,
      notes: payments.notes,
      saleId: payments.saleId,
      projectId: payments.projectId,
      buyerName: sales.buyerName,
      unitLabel: revenueUnits.label,
      unitType: revenueUnits.unitType,
      projectName: projects.name,
    })
    .from(payments)
    .leftJoin(sales, eq(payments.saleId, sales.id))
    .leftJoin(revenueUnits, eq(sales.unitId, revenueUnits.id))
    .leftJoin(projects, eq(payments.projectId, projects.id))
    .orderBy(desc(payments.paymentDate));

  let result = allPayments;
  if (filters?.projectId) result = result.filter(p => p.projectId === filters.projectId);
  if (filters?.from) result = result.filter(p => p.paymentDate >= filters.from!);
  if (filters?.to) result = result.filter(p => p.paymentDate <= filters.to!);
  return result;
}

export async function getPaymentsSummary() {
  const all = await db.select({ amount: payments.amount, paymentDate: payments.paymentDate, projectId: payments.projectId }).from(payments);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const q = Math.floor(now.getMonth() / 3);
  const qStart = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`;

  const total = all.reduce((s, p) => s + p.amount, 0);
  const thisMonthTotal = all.filter(p => p.paymentDate.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
  const thisQuarterTotal = all.filter(p => p.paymentDate >= qStart).reduce((s, p) => s + p.amount, 0);

  // Monthly breakdown (last 12 months)
  const monthly: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = 0;
  }
  for (const p of all) {
    const key = p.paymentDate.substring(0, 7);
    if (key in monthly) monthly[key] += p.amount;
  }

  // By project
  const byProject: Record<string, number> = {};
  for (const p of all) {
    byProject[p.projectId] = (byProject[p.projectId] || 0) + p.amount;
  }

  return { total, thisMonthTotal, thisQuarterTotal, monthly, byProject };
}

export async function getPaymentsSumBySale(saleId: string): Promise<number> {
  const result = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments).where(eq(payments.saleId, saleId));
  return result[0]?.total ?? 0;
}

export async function createPayment(data: { saleId: string; projectId: string; amount: number; paymentDate: string; label?: string; notes?: string }) {
  const now = new Date().toISOString();
  const [payment] = await db.insert(payments).values({
    id: nanoid(),
    saleId: data.saleId,
    projectId: data.projectId,
    amount: data.amount,
    paymentDate: data.paymentDate,
    label: data.label || null,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return payment;
}

export async function updatePayment(id: string, data: Partial<{ amount: number; paymentDate: string; label: string; notes: string }>) {
  const [payment] = await db.update(payments).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(payments.id, id)).returning();
  return payment;
}

export async function deletePayment(id: string) {
  await db.delete(payments).where(eq(payments.id, id));
}
