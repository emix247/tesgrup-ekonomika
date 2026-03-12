import { db } from '@/lib/db';
import { overheadCosts, overheadAllocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Overhead Costs ─────────────────────────────────────

export async function getOverheadCosts() {
  return db.select().from(overheadCosts);
}

export async function createOverheadCost(data: {
  name: string;
  monthlyAmount: number;
  category?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  const id = nanoid();
  await db.insert(overheadCosts).values({
    id,
    name: data.name,
    monthlyAmount: data.monthlyAmount,
    category: data.category || null,
    isActive: data.isActive ?? true,
    validFrom: data.validFrom || null,
    validTo: data.validTo || null,
    notes: data.notes || null,
  });
  const rows = await db.select().from(overheadCosts).where(eq(overheadCosts.id, id));
  return rows[0];
}

export async function updateOverheadCost(id: string, data: Partial<{
  name: string;
  monthlyAmount: number;
  category: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  notes: string;
}>) {
  await db.update(overheadCosts).set(data).where(eq(overheadCosts.id, id));
  const rows = await db.select().from(overheadCosts).where(eq(overheadCosts.id, id));
  return rows[0];
}

export async function deleteOverheadCost(id: string) {
  await db.delete(overheadCosts).where(eq(overheadCosts.id, id));
}

// ── Allocations ────────────────────────────────────────

export async function getOverheadAllocations() {
  return db.select().from(overheadAllocations);
}

export async function upsertOverheadAllocation(data: {
  id?: string;
  projectId: string;
  allocationPercent: number;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  if (data.id) {
    await db.update(overheadAllocations).set({
      allocationPercent: data.allocationPercent,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      notes: data.notes || null,
    }).where(eq(overheadAllocations.id, data.id));
    const rows = await db.select().from(overheadAllocations).where(eq(overheadAllocations.id, data.id));
    return rows[0];
  }

  const id = nanoid();
  await db.insert(overheadAllocations).values({
    id,
    projectId: data.projectId,
    allocationPercent: data.allocationPercent,
    validFrom: data.validFrom || null,
    validTo: data.validTo || null,
    notes: data.notes || null,
  });
  const rows = await db.select().from(overheadAllocations).where(eq(overheadAllocations.id, id));
  return rows[0];
}

export async function deleteOverheadAllocation(id: string) {
  await db.delete(overheadAllocations).where(eq(overheadAllocations.id, id));
}
