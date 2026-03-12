import { db } from '@/lib/db';
import { milestones } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getMilestones(projectId: string) {
  return db.select().from(milestones).where(eq(milestones.projectId, projectId));
}

export async function createMilestone(projectId: string, data: {
  name: string;
  plannedDate?: string;
  actualDate?: string;
  status?: string;
  sortOrder?: number;
}) {
  const id = nanoid();
  await db.insert(milestones).values({
    id,
    projectId,
    name: data.name,
    plannedDate: data.plannedDate || null,
    actualDate: data.actualDate || null,
    status: data.status || 'ceka',
    sortOrder: data.sortOrder ?? 0,
  });
  const rows = await db.select().from(milestones).where(eq(milestones.id, id));
  return rows[0];
}

export async function updateMilestone(id: string, data: Partial<{
  name: string;
  plannedDate: string;
  actualDate: string;
  status: string;
  sortOrder: number;
}>) {
  await db.update(milestones).set(data).where(eq(milestones.id, id));
  const rows = await db.select().from(milestones).where(eq(milestones.id, id));
  return rows[0];
}

export async function deleteMilestone(id: string) {
  await db.delete(milestones).where(eq(milestones.id, id));
}
