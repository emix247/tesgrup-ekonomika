import { db } from '@/lib/db';
import { taxConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getTaxConfig(projectId: string) {
  const rows = await db.select().from(taxConfig).where(eq(taxConfig.projectId, projectId));
  return rows[0];
}

export async function upsertTaxConfig(projectId: string, data: {
  taxForm: string;
  vatPayer?: boolean;
  vatRateRevenue?: number;
  vatRateCosts?: number;
  foOtherIncome?: number;
  citRate?: number;
  notes?: string;
}) {
  const existing = await getTaxConfig(projectId);
  if (existing) {
    await db.update(taxConfig).set(data).where(eq(taxConfig.id, existing.id));
    return getTaxConfig(projectId);
  }
  const id = nanoid();
  await db.insert(taxConfig).values({
    id,
    projectId,
    taxForm: data.taxForm,
    vatPayer: data.vatPayer ?? true,
    vatRateRevenue: data.vatRateRevenue ?? 21,
    vatRateCosts: data.vatRateCosts ?? 21,
    foOtherIncome: data.foOtherIncome ?? null,
    citRate: data.citRate ?? null,
    notes: data.notes || null,
  });
  return getTaxConfig(projectId);
}
