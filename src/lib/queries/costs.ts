import { db } from '@/lib/db';
import { forecastCosts, actualCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { netToGross, vatFromGross, getDefaultVatRate } from '@/lib/utils/vat';

// ── Forecast Costs ─────────────────────────────────────

export async function getForecastCosts(projectId: string) {
  return db.select().from(forecastCosts).where(eq(forecastCosts.projectId, projectId));
}

export async function createForecastCost(projectId: string, data: {
  category: string;
  label?: string;
  amount: number;
  amountBezDph?: number;
  vatRate?: number;
  area?: number;
  ratePerM2?: number;
  notes?: string;
  sortOrder?: number;
}) {
  const id = nanoid();
  const vatRate = data.vatRate ?? getDefaultVatRate('cost', data.category);

  // If user provided bez DPH, calculate vč. DPH
  let amount = data.amount;
  if (data.amountBezDph != null && data.amount == null) {
    amount = Math.round(netToGross(data.amountBezDph, vatRate));
  }

  await db.insert(forecastCosts).values({
    id,
    projectId,
    category: data.category,
    label: data.label || null,
    amount,
    vatRate,
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
  amountBezDph: number;
  vatRate: number;
  area: number;
  ratePerM2: number;
  notes: string;
  sortOrder: number;
}>) {
  const currentRows = await db.select().from(forecastCosts).where(eq(forecastCosts.id, id));
  const current = currentRows[0];

  if (current) {
    const vatRate = data.vatRate ?? current.vatRate ?? 21;

    // If user sent bezDph → compute amount (vč. DPH)
    if ('amountBezDph' in data && data.amountBezDph != null) {
      data.amount = Math.round(netToGross(data.amountBezDph, vatRate));
    }

    // If vatRate changed without new amount → keep bez DPH stable
    if ('vatRate' in data && !('amount' in data) && !('amountBezDph' in data)) {
      const oldRate = current.vatRate ?? 21;
      const oldAmount = current.amount ?? 0;
      if (oldAmount > 0) {
        const bezDph = oldAmount / (1 + oldRate / 100);
        data.amount = Math.round(netToGross(bezDph, vatRate));
      }
    }
  }

  const { amountBezDph: _bezDph, ...dbData } = data;
  await db.update(forecastCosts).set(dbData).where(eq(forecastCosts.id, id));
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
  amountBezDph?: number;
  vatRate?: number;
  vatAmount?: number;
  paymentStatus?: string;
  paymentDate?: string;
  notes?: string;
}) {
  const id = nanoid();
  const vatRate = data.vatRate ?? getDefaultVatRate('cost', data.category);

  let amount = data.amount;
  if (data.amountBezDph != null && data.amount == null) {
    amount = Math.round(netToGross(data.amountBezDph, vatRate));
  }

  // Auto-calculate vatAmount from amount and vatRate
  const vatAmount = data.vatAmount ?? Math.round(vatFromGross(amount, vatRate));

  await db.insert(actualCosts).values({
    id,
    projectId,
    category: data.category,
    supplier: data.supplier || null,
    description: data.description || null,
    invoiceNumber: data.invoiceNumber || null,
    invoiceDate: data.invoiceDate || null,
    dueDate: data.dueDate || null,
    amount,
    vatRate,
    vatAmount,
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
  amountBezDph: number;
  vatRate: number;
  vatAmount: number;
  paymentStatus: string;
  paymentDate: string;
  notes: string;
}>) {
  const currentRows = await db.select().from(actualCosts).where(eq(actualCosts.id, id));
  const current = currentRows[0];

  if (current) {
    const vatRate = data.vatRate ?? current.vatRate ?? 21;

    if ('amountBezDph' in data && data.amountBezDph != null) {
      data.amount = Math.round(netToGross(data.amountBezDph, vatRate));
    }

    if ('vatRate' in data && !('amount' in data) && !('amountBezDph' in data)) {
      const oldRate = current.vatRate ?? 21;
      const oldAmount = current.amount ?? 0;
      if (oldAmount > 0) {
        const bezDph = oldAmount / (1 + oldRate / 100);
        data.amount = Math.round(netToGross(bezDph, vatRate));
      }
    }

    // Auto-recalculate vatAmount when amount or vatRate changes
    if ('amount' in data || 'vatRate' in data) {
      const amt = data.amount ?? current.amount;
      data.vatAmount = Math.round(vatFromGross(amt, vatRate));
    }
  }

  const { amountBezDph: _bezDph, ...dbData } = data;
  await db.update(actualCosts).set(dbData).where(eq(actualCosts.id, id));
  const rows = await db.select().from(actualCosts).where(eq(actualCosts.id, id));
  return rows[0];
}

export async function deleteActualCost(id: string) {
  await db.delete(actualCosts).where(eq(actualCosts.id, id));
}
