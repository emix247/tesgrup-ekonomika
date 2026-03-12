import { db } from '@/lib/db';
import { loanDrawdowns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getDrawdowns(projectId: string) {
  return db.select().from(loanDrawdowns).where(eq(loanDrawdowns.projectId, projectId));
}

export async function createDrawdown(projectId: string, data: {
  loanType: string;
  plannedDate?: string;
  actualDate?: string;
  plannedAmount?: number;
  actualAmount?: number;
  purpose?: string;
  notes?: string;
}) {
  const id = nanoid();
  await db.insert(loanDrawdowns).values({
    id,
    projectId,
    loanType: data.loanType,
    plannedDate: data.plannedDate || null,
    actualDate: data.actualDate || null,
    plannedAmount: data.plannedAmount ?? null,
    actualAmount: data.actualAmount ?? null,
    purpose: data.purpose || null,
    notes: data.notes || null,
  });
  const rows = await db.select().from(loanDrawdowns).where(eq(loanDrawdowns.id, id));
  return rows[0];
}

export async function updateDrawdown(id: string, data: Partial<{
  loanType: string;
  plannedDate: string;
  actualDate: string;
  plannedAmount: number;
  actualAmount: number;
  purpose: string;
  notes: string;
}>) {
  await db.update(loanDrawdowns).set(data).where(eq(loanDrawdowns.id, id));
  const rows = await db.select().from(loanDrawdowns).where(eq(loanDrawdowns.id, id));
  return rows[0];
}

export async function deleteDrawdown(id: string) {
  await db.delete(loanDrawdowns).where(eq(loanDrawdowns.id, id));
}
