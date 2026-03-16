import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function getAllProjects() {
  return db.select().from(projects).where(ne(projects.status, 'archivovano'));
}

export async function getArchivedProjects() {
  return db.select().from(projects).where(eq(projects.status, 'archivovano'));
}

export async function getAllProjectsIncludingArchived() {
  return db.select().from(projects);
}

export async function getProjectById(id: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id));
  return rows[0];
}

export async function createProject(data: {
  name: string;
  type: string;
  location?: string;
  legalEntity?: string;
  legalForm?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  constructionStartDate?: string;
  notes?: string;
}) {
  const now = new Date().toISOString();
  const id = nanoid();
  await db.insert(projects)
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
      constructionStartDate: data.constructionStartDate || null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });
  return getProjectById(id);
}

export async function updateProject(
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
    constructionStartDate: string;
    notes: string;
  }>
) {
  const now = new Date().toISOString();
  await db.update(projects)
    .set({ ...data, updatedAt: now })
    .where(eq(projects.id, id));
  return getProjectById(id);
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}
