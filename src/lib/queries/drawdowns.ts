import { db } from '@/lib/db';
import { loanDrawdowns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getDrawdowns(projectId: string) {
  return db.select().from(loanDrawdowns).where(eq(loanDrawdowns.projectId, projectId)).all();
}

export function createDrawdown(projectId: string, data: {
  loanType: string;
  plannedDate?: string;
  actualDate?: string;
  plannedAmount?: number;
  actualAmount?: number;
  purpose?: string;
  notes?: string;
}) {
  const id = nanoid();
  db.insert(loanDrawdowns).values({
    id,
    projectId,
    loanType: data.loanType,
    plannedDate: data.plannedDate || null,
    actualDate: data.actualDate || null,
    plannedAmount: data.plannedAmount ?? null,
    actualAmount: data.actualAmount ?? null,
    purpose: data.purpose || null,
    notes: data.notes || null,
  }).run();
  return db.select().from(loanDrawdowns).where(eq(loanDrawdowns.id, id)).get();
}

export function updateDrawdown(id: string, data: Partial<{
  loanType: string;
  plannedDate: string;
  actualDate: string;
  plannedAmount: number;
  actualAmount: number;
  purpose: string;
  notes: string;
}>) {
  db.update(loanDrawdowns).set(data).where(eq(loanDrawdowns.id, id)).run();
  return db.select().from(loanDrawdowns).where(eq(loanDrawdowns.id, id)).get();
}

export function deleteDrawdown(id: string) {
  db.delete(loanDrawdowns).where(eq(loanDrawdowns.id, id)).run();
}
