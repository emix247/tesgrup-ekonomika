import { db } from '@/lib/db';
import { financing } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getFinancing(projectId: string) {
  return db.select().from(financing).where(eq(financing.projectId, projectId)).get();
}

export function upsertFinancing(projectId: string, data: {
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
  const existing = getFinancing(projectId);
  if (existing) {
    db.update(financing).set(data).where(eq(financing.id, existing.id)).run();
    return getFinancing(projectId);
  }
  const id = nanoid();
  db.insert(financing).values({
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
  }).run();
  return getFinancing(projectId);
}
