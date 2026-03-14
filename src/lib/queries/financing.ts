import { db } from '@/lib/db';
import { financing } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getFinancing(projectId: string) {
  const rows = await db.select().from(financing).where(eq(financing.projectId, projectId));
  return rows[0];
}

export async function upsertFinancing(projectId: string, data: {
  equityAmount?: number | null;
  bankLoanAmount?: number | null;
  bankLoanRate?: number | null;
  bankLoanDurationMonths?: number | null;
  bankLoanFee?: number | null;
  bankLoanStartDate?: string | null;
  investorLoanAmount?: number | null;
  investorLoanRate?: number | null;
  investorLoanDurationMonths?: number | null;
  investorLoanStartDate?: string | null;
  notes?: string | null;
}) {
  // Normalize: convert empty strings to null, keep numbers as-is
  const normalized = {
    equityAmount: data.equityAmount ?? 0,
    bankLoanAmount: data.bankLoanAmount ?? 0,
    bankLoanRate: data.bankLoanRate ?? 0,
    bankLoanDurationMonths: data.bankLoanDurationMonths ?? 0,
    bankLoanFee: data.bankLoanFee ?? 0,
    bankLoanStartDate: data.bankLoanStartDate || null,
    investorLoanAmount: data.investorLoanAmount ?? 0,
    investorLoanRate: data.investorLoanRate ?? 0,
    investorLoanDurationMonths: data.investorLoanDurationMonths ?? 0,
    investorLoanStartDate: data.investorLoanStartDate || null,
    notes: data.notes || null,
  };

  const existing = await getFinancing(projectId);
  if (existing) {
    await db.update(financing).set(normalized).where(eq(financing.id, existing.id));
    return getFinancing(projectId);
  }
  const id = nanoid();
  await db.insert(financing).values({
    id,
    projectId,
    ...normalized,
  });
  return getFinancing(projectId);
}
