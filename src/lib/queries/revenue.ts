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
  // Auto-calculate related price fields
  // First get current values to have context for calculation
  const currentRows = await db.select().from(revenueUnits).where(eq(revenueUnits.id, id));
  const current = currentRows[0];

  if (current) {
    const newArea = data.area ?? current.area;
    const newPricePerM2 = data.pricePerM2 ?? current.pricePerM2;
    const newTotalPrice = data.totalPrice ?? current.totalPrice;

    if (newArea && newArea > 0) {
      if ('pricePerM2' in data && data.pricePerM2 != null) {
        // User changed Kč/m² → recalculate totalPrice
        data.totalPrice = Math.round(newArea * data.pricePerM2);
      } else if ('totalPrice' in data && data.totalPrice != null) {
        // User changed totalPrice → recalculate Kč/m²
        data.pricePerM2 = Math.round(data.totalPrice / newArea);
      } else if ('area' in data && data.area != null && newPricePerM2 && newPricePerM2 > 0) {
        // User changed area → recalculate totalPrice from existing Kč/m²
        data.totalPrice = Math.round(data.area * newPricePerM2);
      }
    }
  }

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
  // Auto-recalculate totalPrice when quantity or unitPrice changes
  if ('quantity' in data || 'unitPrice' in data) {
    const currentRows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
    const current = currentRows[0];
    if (current) {
      const qty = data.quantity ?? current.quantity;
      const price = data.unitPrice ?? current.unitPrice;
      data.totalPrice = qty * price;
    }
  }

  await db.update(revenueExtras).set(data).where(eq(revenueExtras.id, id));
  const rows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
  return rows[0];
}

export async function deleteRevenueExtra(id: string) {
  await db.delete(revenueExtras).where(eq(revenueExtras.id, id));
}
