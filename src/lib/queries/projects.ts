import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export function getAllProjects() {
  return db.select().from(projects).all();
}

export function getProjectById(id: string) {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export function createProject(data: {
  name: string;
  type: string;
  location?: string;
  legalEntity?: string;
  legalForm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}) {
  const now = new Date().toISOString();
  const id = nanoid();
  db.insert(projects)
    .values({
      id,
      name: data.name,
      type: data.type,
      location: data.location || null,
      legalEntity: data.legalEntity || null,
      legalForm: data.legalForm || null,
      status: data.status || 'priprava',
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return getProjectById(id);
}

export function updateProject(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    location: string;
    legalEntity: string;
    legalForm: string;
    status: string;
    startDate: string;
    endDate: string;
    notes: string;
  }>
) {
  const now = new Date().toISOString();
  db.update(projects)
    .set({ ...data, updatedAt: now })
    .where(eq(projects.id, id))
    .run();
  return getProjectById(id);
}

export function deleteProject(id: string) {
  db.delete(projects).where(eq(projects.id, id)).run();
}
