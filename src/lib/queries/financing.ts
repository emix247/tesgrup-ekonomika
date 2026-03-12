import { db } from '@/lib/db';
import { financing } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getFinancing(projectId: string) {
  const rows = await db.select().from(financing).where(eq(financing.projectId, projectId));
  return rows[0];
}

export async function upsertFinancing(projectId: string, data: {
  equityAmount?: number;
  bankLoanAmount?: number;
  bankLoanRate?: number;
  bankLoanDurationMonths?: number;
  bankLoanFee?: number;
  investorLoanAmount?: number;
  investorLoanRate?: number;
  investorLoanDurationMonths?: number;
  notes?: string;
}) {
  const existing = await getFinancing(projectId);
  if (existing) {
    await db.update(financing).set(data).where(eq(financing.id, existing.id));
    return getFinancing(projectId);
  }
  const id = nanoid();
  await db.insert(financing).values({
    id,
    projectId,
    equityAmount: data.equityAmount ?? 0,
    bankLoanAmount: data.bankLoanAmount ?? 0,
    bankLoanRate: data.bankLoanRate ?? 0,
    bankLoanDurationMonths: data.bankLoanDurationMonths ?? 0,
    bankLoanFee: data.bankLoanFee ?? 0,
    investorLoanAmount: data.investorLoanAmount ?? 0,
    investorLoanRate: data.investorLoanRate ?? 0,
    investorLoanDurationMonths: data.investorLoanDurationMonths ?? 0,
    notes: data.notes || null,
  });
  return getFinancing(projectId);
}
