import { db } from '@/lib/db';
import { revenueUnits, revenueExtras } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Units ──────────────────────────────────────────────

export function getRevenueUnits(projectId: string) {
  return db.select().from(revenueUnits).where(eq(revenueUnits.projectId, projectId)).all();
}

export function createRevenueUnit(projectId: string, data: {
  unitType: string;
  label?: string;
  area?: number;
  pricePerM2?: number;
  totalPrice?: number;
  plannedSaleMonth?: number;
}) {
  const id = nanoid();
  const total = data.totalPrice ?? ((data.area || 0) * (data.pricePerM2 || 0));
  db.insert(revenueUnits).values({
    id,
    projectId,
    unitType: data.unitType,
    label: data.label || null,
    area: data.area ?? null,
    pricePerM2: data.pricePerM2 ?? null,
    totalPrice: total || null,
    plannedSaleMonth: data.plannedSaleMonth ?? null,
  }).run();
  return db.select().from(revenueUnits).where(eq(revenueUnits.id, id)).get();
}

export function updateRevenueUnit(id: string, data: Partial<{
  unitType: string;
  label: string;
  area: number;
  pricePerM2: number;
  totalPrice: number;
  plannedSaleMonth: number;
}>) {
  db.update(revenueUnits).set(data).where(eq(revenueUnits.id, id)).run();
  return db.select().from(revenueUnits).where(eq(revenueUnits.id, id)).get();
}

export function deleteRevenueUnit(id: string) {
  db.delete(revenueUnits).where(eq(revenueUnits.id, id)).run();
}

// ── Extras ─────────────────────────────────────────────

export function getRevenueExtras(projectId: string) {
  return db.select().from(revenueExtras).where(eq(revenueExtras.projectId, projectId)).all();
}

export function createRevenueExtra(projectId: string, data: {
  category: string;
  label?: string;
  quantity?: number;
  unitPrice: number;
  totalPrice?: number;
}) {
  const id = nanoid();
  const qty = data.quantity ?? 1;
  const total = data.totalPrice ?? qty * data.unitPrice;
  db.insert(revenueExtras).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    quantity: qty,
    unitPrice: data.unitPrice,
    totalPrice: total,
  }).run();
  return db.select().from(revenueExtras).where(eq(revenueExtras.id, id)).get();
}

export function updateRevenueExtra(id: string, data: Partial<{
  category: string;
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}>) {
  db.update(revenueExtras).set(data).where(eq(revenueExtras.id, id)).run();
  return db.select().from(revenueExtras).where(eq(revenueExtras.id, id)).get();
}

export function deleteRevenueExtra(id: string) {
  db.delete(revenueExtras).where(eq(revenueExtras.id, id)).run();
}
