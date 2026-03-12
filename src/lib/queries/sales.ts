import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getSales(projectId: string) {
  return db.select().from(sales).where(eq(sales.projectId, projectId)).all();
}

export function createSale(projectId: string, data: {
  unitId?: string;
  buyerName?: string;
  status?: string;
  reservationDate?: string;
  contractDate?: string;
  paymentDate?: string;
  agreedPrice?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  notes?: string;
}) {
  const id = nanoid();
  const now = new Date().toISOString();
  db.insert(sales).values({
    id,
    projectId,
    unitId: data.unitId || null,
    buyerName: data.buyerName || null,
    status: data.status || 'rezervace',
    reservationDate: data.reservationDate || null,
    contractDate: data.contractDate || null,
    paymentDate: data.paymentDate || null,
    agreedPrice: data.agreedPrice ?? null,
    depositAmount: data.depositAmount ?? null,
    depositPaid: data.depositPaid ?? false,
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  }).run();
  return db.select().from(sales).where(eq(sales.id, id)).get();
}

export function updateSale(id: string, data: Partial<{
  buyerName: string;
  status: string;
  reservationDate: string;
  contractDate: string;
  paymentDate: string;
  agreedPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  notes: string;
}>) {
  const now = new Date().toISOString();
  db.update(sales).set({ ...data, updatedAt: now }).where(eq(sales.id, id)).run();
  return db.select().from(sales).where(eq(sales.id, id)).get();
}

export function deleteSale(id: string) {
  db.delete(sales).where(eq(sales.id, id)).run();
}
