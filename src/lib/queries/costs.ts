import { db } from '@/lib/db';
import { forecastCosts, actualCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Forecast Costs ─────────────────────────────────────

export async function getForecastCosts(projectId: string) {
  return db.select().from(forecastCosts).where(eq(forecastCosts.projectId, projectId));
}

export async function createForecastCost(projectId: string, data: {
  category: string;
  label?: string;
  amount: number;
  area?: number;
  ratePerM2?: number;
  notes?: string;
  sortOrder?: number;
}) {
  const id = nanoid();
  await db.insert(forecastCosts).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    amount: data.amount,
    area: data.area ?? null,
    ratePerM2: data.ratePerM2 ?? null,
    notes: data.notes || null,
    sortOrder: data.sortOrder ?? 0,
  });
  const rows = await db.select().from(forecastCosts).where(eq(forecastCosts.id, id));
  return rows[0];
}

export async function updateForecastCost(id: string, data: Partial<{
  category: string;
  label: string;
  amount: number;
  area: number;
  ratePerM2: number;
  notes: string;
  sortOrder: number;
}>) {
  await db.update(forecastCosts).set(data).where(eq(forecastCosts.id, id));
  const rows = await db.select().from(forecastCosts).where(eq(forecastCosts.id, id));
  return rows[0];
}

export async function deleteForecastCost(id: string) {
  await db.delete(forecastCosts).where(eq(forecastCosts.id, id));
}

// ── Actual Costs ───────────────────────────────────────

export async function getActualCosts(projectId: string) {
  return db.select().from(actualCosts).where(eq(actualCosts.projectId, projectId));
}

export async function createActualCost(projectId: string, data: {
  category: string;
  supplier?: string;
  description?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount: number;
  vatAmount?: number;
  paymentStatus?: string;
  paymentDate?: string;
  notes?: string;
}) {
  const id = nanoid();
  await db.insert(actualCosts).values({
    id,
    projectId,
    category: data.category,
    supplier: data.supplier || null,
    description: data.description || null,
    invoiceNumber: data.invoiceNumber || null,
    invoiceDate: data.invoiceDate || null,
    dueDate: data.dueDate || null,
    amount: data.amount,
    vatAmount: data.vatAmount ?? null,
    paymentStatus: data.paymentStatus || 'neuhrazeno',
    paymentDate: data.paymentDate || null,
    notes: data.notes || null,
    createdAt: new Date().toISOString(),
  });
  const rows = await db.select().from(actualCosts).where(eq(actualCosts.id, id));
  return rows[0];
}

export async function updateActualCost(id: string, data: Partial<{
  category: string;
  supplier: string;
  description: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  paymentStatus: string;
  paymentDate: string;
  notes: string;
}>) {
  await db.update(actualCosts).set(data).where(eq(actualCosts.id, id));
  const rows = await db.select().from(actualCosts).where(eq(actualCosts.id, id));
  return rows[0];
}

export async function deleteActualCost(id: string) {
  await db.delete(actualCosts).where(eq(actualCosts.id, id));
}
