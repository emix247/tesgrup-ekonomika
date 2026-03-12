import { db } from '@/lib/db';
import { overheadCosts, overheadAllocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ── Overhead Costs ─────────────────────────────────────

export function getOverheadCosts() {
  return db.select().from(overheadCosts).all();
}

export function createOverheadCost(data: {
  name: string;
  monthlyAmount: number;
  category?: string;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  const id = nanoid();
  db.insert(overheadCosts).values({
    id,
    name: data.name,
    monthlyAmount: data.monthlyAmount,
    category: data.category || null,
    isActive: data.isActive ?? true,
    validFrom: data.validFrom || null,
    validTo: data.validTo || null,
    notes: data.notes || null,
  }).run();
  return db.select().from(overheadCosts).where(eq(overheadCosts.id, id)).get();
}

export function updateOverheadCost(id: string, data: Partial<{
  name: string;
  monthlyAmount: number;
  category: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  notes: string;
}>) {
  db.update(overheadCosts).set(data).where(eq(overheadCosts.id, id)).run();
  return db.select().from(overheadCosts).where(eq(overheadCosts.id, id)).get();
}

export function deleteOverheadCost(id: string) {
  db.delete(overheadCosts).where(eq(overheadCosts.id, id)).run();
}

// ── Allocations ────────────────────────────────────────

export function getOverheadAllocations() {
  return db.select().from(overheadAllocations).all();
}

export function upsertOverheadAllocation(data: {
  id?: string;
  projectId: string;
  allocationPercent: number;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  if (data.id) {
    db.update(overheadAllocations).set({
      allocationPercent: data.allocationPercent,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
      notes: data.notes || null,
    }).where(eq(overheadAllocations.id, data.id)).run();
    return db.select().from(overheadAllocations).where(eq(overheadAllocations.id, data.id)).get();
  }

  const id = nanoid();
  db.insert(overheadAllocations).values({
    id,
    projectId: data.projectId,
    allocationPercent: data.allocationPercent,
    validFrom: data.validFrom || null,
    validTo: data.validTo || null,
    notes: data.notes || null,
  }).run();
  return db.select().from(overheadAllocations).where(eq(overheadAllocations.id, id)).get();
}

export function deleteOverheadAllocation(id: string) {
  db.delete(overheadAllocations).where(eq(overheadAllocations.id, id)).run();
}
