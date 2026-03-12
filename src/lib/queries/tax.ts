import { db } from '@/lib/db';
import { taxConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getTaxConfig(projectId: string) {
  return db.select().from(taxConfig).where(eq(taxConfig.projectId, projectId)).get();
}

export function upsertTaxConfig(projectId: string, data: {
  taxForm: string;
  vatPayer?: boolean;
  vatRateRevenue?: number;
  vatRateCosts?: number;
  foOtherIncome?: number;
  citRate?: number;
  notes?: string;
}) {
  const existing = getTaxConfig(projectId);
  if (existing) {
    db.update(taxConfig).set(data).where(eq(taxConfig.id, existing.id)).run();
    return getTaxConfig(projectId);
  }
  const id = nanoid();
  db.insert(taxConfig).values({
    id,
    projectId,
    taxForm: data.taxForm,
    vatPayer: data.vatPayer ?? true,
    vatRateRevenue: data.vatRateRevenue ?? 21,
    vatRateCosts: data.vatRateCosts ?? 21,
    foOtherIncome: data.foOtherIncome ?? null,
    citRate: data.citRate ?? null,
    notes: data.notes || null,
  }).run();
  return getTaxConfig(projectId);
}
