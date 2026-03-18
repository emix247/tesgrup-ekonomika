import { db } from '@/lib/db';
import { revenueUnits, revenueExtras } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { netToGross, getDefaultVatRate } from '@/lib/utils/vat';
import { checkVersion } from '@/lib/db/optimistic-lock';

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
  totalPriceBezDph?: number;
  vatRate?: number;
  taxExempt?: boolean;
  plannedSaleMonth?: number;
}) {
  const id = nanoid();
  const vatRate = data.vatRate ?? getDefaultVatRate('revenue');

  // If user provided bez DPH price, calculate vč. DPH
  let total = data.totalPrice;
  if (total == null && data.totalPriceBezDph != null) {
    total = Math.round(netToGross(data.totalPriceBezDph, vatRate));
  }

  // Auto-calculate missing price fields
  let ppm2 = data.pricePerM2;
  const area = data.area || 0;

  if (total == null && ppm2 != null && area > 0) {
    total = Math.round(area * ppm2);
  } else if (total != null && ppm2 == null && area > 0) {
    ppm2 = Math.round(total / area);
  } else if (total == null && ppm2 == null) {
    total = undefined;
  }

  await db.insert(revenueUnits).values({
    id,
    projectId,
    unitType: data.unitType,
    label: data.label || null,
    area: data.area ?? null,
    pricePerM2: ppm2 ?? null,
    totalPrice: total ?? null,
    vatRate,
    taxExempt: data.taxExempt ?? false,
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
  totalPriceBezDph: number;
  vatRate: number;
  taxExempt: boolean;
  plannedSaleMonth: number;
  version: number;
}>) {
  const currentRows = await db.select().from(revenueUnits).where(eq(revenueUnits.id, id));
  const current = currentRows[0];
  if (current) checkVersion(data.version, current.version);

  if (current) {
    const vatRate = data.vatRate ?? current.vatRate ?? 12;

    // If user sent bezDph value → compute totalPrice (vč. DPH)
    if ('totalPriceBezDph' in data && data.totalPriceBezDph != null) {
      data.totalPrice = Math.round(netToGross(data.totalPriceBezDph, vatRate));
    }

    // If vatRate changed (without new price), keep bez DPH stable → recalc totalPrice
    if ('vatRate' in data && !('totalPrice' in data) && !('totalPriceBezDph' in data)) {
      const oldRate = current.vatRate ?? 12;
      const oldTotal = current.totalPrice ?? 0;
      if (oldTotal > 0) {
        const bezDph = oldTotal / (1 + oldRate / 100);
        data.totalPrice = Math.round(netToGross(bezDph, vatRate));
      }
    }

    // Auto-calculate related price fields
    const newArea = data.area ?? current.area;
    const newPricePerM2 = data.pricePerM2 ?? current.pricePerM2;
    const newTotalPrice = data.totalPrice ?? current.totalPrice;

    if (newArea && newArea > 0) {
      if ('pricePerM2' in data && data.pricePerM2 != null) {
        data.totalPrice = Math.round(newArea * data.pricePerM2);
      } else if ('totalPrice' in data && data.totalPrice != null) {
        data.pricePerM2 = Math.round(data.totalPrice / newArea);
      } else if ('area' in data && data.area != null) {
        if (newPricePerM2 && newPricePerM2 > 0) {
          data.totalPrice = Math.round(data.area * newPricePerM2);
        } else if (newTotalPrice && newTotalPrice > 0) {
          data.pricePerM2 = Math.round(newTotalPrice / data.area);
        }
      }
    }
  }

  // Remove virtual fields before DB update, increment version
  const { totalPriceBezDph: _bezDph, version: _ver, ...dbData } = data;
  await db.update(revenueUnits).set({ ...dbData, version: (current?.version ?? 0) + 1 }).where(eq(revenueUnits.id, id));
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
  totalPriceBezDph?: number;
  vatRate?: number;
  taxExempt?: boolean;
}) {
  const id = nanoid();
  const vatRate = data.vatRate ?? getDefaultVatRate('revenue');
  const qty = data.quantity ?? 1;

  let total = data.totalPrice ?? qty * data.unitPrice;
  if (data.totalPrice == null && data.totalPriceBezDph != null) {
    total = Math.round(netToGross(data.totalPriceBezDph, vatRate));
  }

  await db.insert(revenueExtras).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    quantity: qty,
    unitPrice: data.unitPrice,
    totalPrice: total,
    vatRate,
    taxExempt: data.taxExempt ?? false,
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
  totalPriceBezDph: number;
  vatRate: number;
  taxExempt: boolean;
  version: number;
}>) {
  const currentRows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
  const current = currentRows[0];
  if (current) checkVersion(data.version, current.version);

  if (current) {
    const vatRate = data.vatRate ?? current.vatRate ?? 12;

    // If user sent bezDph → compute totalPrice
    if ('totalPriceBezDph' in data && data.totalPriceBezDph != null) {
      data.totalPrice = Math.round(netToGross(data.totalPriceBezDph, vatRate));
    }

    // If vatRate changed without new price → keep bez DPH stable
    if ('vatRate' in data && !('totalPrice' in data) && !('totalPriceBezDph' in data)) {
      const oldRate = current.vatRate ?? 12;
      const oldTotal = current.totalPrice ?? 0;
      if (oldTotal > 0) {
        const bezDph = oldTotal / (1 + oldRate / 100);
        data.totalPrice = Math.round(netToGross(bezDph, vatRate));
      }
    }

    // Auto-recalculate totalPrice when quantity or unitPrice changes
    if ('quantity' in data || 'unitPrice' in data) {
      const qty = data.quantity ?? current.quantity;
      const price = data.unitPrice ?? current.unitPrice;
      data.totalPrice = qty * price;
    }
  }

  const { totalPriceBezDph: _bezDph, version: _ver, ...dbData } = data;
  await db.update(revenueExtras).set({ ...dbData, version: (current?.version ?? 0) + 1 }).where(eq(revenueExtras.id, id));
  const rows = await db.select().from(revenueExtras).where(eq(revenueExtras.id, id));
  return rows[0];
}

export async function deleteRevenueExtra(id: string) {
  await db.delete(revenueExtras).where(eq(revenueExtras.id, id));
}
