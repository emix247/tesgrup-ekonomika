import { db } from '@/lib/db';
import { forecastCosts, actualCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Forecast Costs ─────────────────────────────────────

export function getForecastCosts(projectId: string) {
  return db.select().from(forecastCosts).where(eq(forecastCosts.projectId, projectId)).all();
}

export function createForecastCost(projectId: string, data: {
  category: string;
  label?: string;
  amount: number;
  area?: number;
  ratePerM2?: number;
  notes?: string;
  sortOrder?: number;
}) {
  const id = nanoid();
  db.insert(forecastCosts).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    amount: data.amount,
    area: data.area ?? null,
    ratePerM2: data.ratePerM2 ?? null,
    notes: data.notes || null,
    sortOrder: data.sortOrder ?? 0,
  }).run();
  return db.select().from(forecastCosts).where(eq(forecastCosts.id, id)).get();
}

export function updateForecastCost(id: string, data: Partial<{
  category: string;
  label: string;
  amount: number;
  area: number;
  ratePerM2: number;
  notes: string;
  sortOrder: number;
}>) {
  db.update(forecastCosts).set(data).where(eq(forecastCosts.id, id)).run();
  return db.select().from(forecastCosts).where(eq(forecastCosts.id, id)).get();
}

export function deleteForecastCost(id: string) {
  db.delete(forecastCosts).where(eq(forecastCosts.id, id)).run();
}

// ── Actual Costs ───────────────────────────────────────

export function getActualCosts(projectId: string) {
  return db.select().from(actualCosts).where(eq(actualCosts.projectId, projectId)).all();
}

export function createActualCost(projectId: string, data: {
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
  db.insert(actualCosts).values({
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
  }).run();
  return db.select().from(actualCosts).where(eq(actualCosts.id, id)).get();
}

export function updateActualCost(id: string, data: Partial<{
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
  db.update(actualCosts).set(data).where(eq(actualCosts.id, id)).run();
  return db.select().from(actualCosts).where(eq(actualCosts.id, id)).get();
}

export function deleteActualCost(id: string) {
  db.delete(actualCosts).where(eq(actualCosts.id, id)).run();
}
