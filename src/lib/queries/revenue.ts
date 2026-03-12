import { db } from '@/lib/db';
import { revenueUnits, revenueExtras } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Units ──────────────────────────────────────────────

export async function getRevenueUnits(projectId: string) {
  return db.select().from(revenueUnits).where(eq(revenueUnits.projectId, projectId));
}

export async function createRevenueUnit(projectId: string, data: {
  unitType: string;
  label?: string;
  area?: number;
  pricePerM2?: number;
  totalPrice?: number;
  plannedSaleMonth?: number;
}) {
  const id = nanoid();
  const total = data.totalPrice ?? ((data.area || 0) * (data.pricePerM2 || 0));
  await db.insert(revenueUnits).values({
    id,
    projectId,
    unitType: data.unitType,
    label: data.label || null,
    area: data.area ?? null,
    pricePerM2: data.pricePerM2 ?? null,
    totalPrice: total || null,
    plannedSaleMonth: data.plannedSaleMonth ?? null,
  });
  const rows = await db.select().from(revenueUnits).where(eq(revenueUnits.id, id));
  return rows[0];
}

export async function updateRevenueUnit(id: string, data: Partial<{
  unitType: string;
  label: string;
  area: number;
  pricePerM2: number;
  totalPrice: number;
  plannedSaleMonth: number;
}>) {
  await db.update(revenueUnits).set(data).where(eq(revenueUnits.id, id));
  const rows = await db.select().from(revenueUnits).where(eq(revenueUnits.id, id));
  return rows[0];
}

export async function deleteRevenueUnit(id: string) {
  await db.delete(revenueUnits).where(eq(revenueUnits.id, id));
}

// ── Extras ─────────────────────────────────────────────

export async function getRevenueExtras(projectId: string) {
  return db.select().from(revenueExtras).where(eq(revenueExtras.projectId, projectId));
}

export async function createRevenueExtra(projectId: string, data: {
  category: string;
  label?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice?: number;
}) {
  const id = nanoid();
  const qty = data.quantity ?? 1;
  const total = data.totalPrice ?? qty * data.unitPrice;
  await db.insert(revenueExtras).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    quantity: qty,
    unitPrice: data.unitPrice,
    totalPrice: total,
  });
  const rows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
  return rows[0];
}

export async function updateRevenueExtra(id: string, data: Partial<{
  category: string;
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}>) {
  await db.update(revenueExtras).set(data).where(eq(revenueExtras.id, id));
  const rows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
  return rows[0];
}

export async function deleteRevenueExtra(id: string) {
  await db.delete(revenueExtras).where(eq(revenueExtras.id, id));
}
