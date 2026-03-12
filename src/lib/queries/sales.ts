import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getSales(projectId: string) {
  return db.select().from(sales).where(eq(sales.projectId, projectId));
}

export async function createSale(projectId: string, data: {
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
  await db.insert(sales).values({
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
  });
  const rows = await db.select().from(sales).where(eq(sales.id, id));
  return rows[0];
}

export async function updateSale(id: string, data: Partial<{
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
  await db.update(sales).set({ ...data, updatedAt: now }).where(eq(sales.id, id));
  const rows = await db.select().from(sales).where(eq(sales.id, id));
  return rows[0];
}

export async function deleteSale(id: string) {
  await db.delete(sales).where(eq(sales.id, id));
}
