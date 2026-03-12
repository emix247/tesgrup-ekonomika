import { db } from '@/lib/db';
import { milestones } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getMilestones(projectId: string) {
  return db.select().from(milestones).where(eq(milestones.projectId, projectId)).all();
}

export function createMilestone(projectId: string, data: {
  name: string;
  plannedDate?: string;
  actualDate?: string;
  status?: string;
  sortOrder?: number;
}) {
  const id = nanoid();
  db.insert(milestones).values({
    id,
    projectId,
    name: data.name,
    plannedDate: data.plannedDate || null,
    actualDate: data.actualDate || null,
    status: data.status || 'ceka',
    sortOrder: data.sortOrder ?? 0,
  }).run();
  return db.select().from(milestones).where(eq(milestones.id, id)).get();
}

export function updateMilestone(id: string, data: Partial<{
  name: string;
  plannedDate: string;
  actualDate: string;
  status: string;
  sortOrder: number;
}>) {
  db.update(milestones).set(data).where(eq(milestones.id, id)).run();
  return db.select().from(milestones).where(eq(milestones.id, id)).get();
}

export function deleteMilestone(id: string) {
  db.delete(milestones).where(eq(milestones.id, id)).run();
}
