import { getOverheadCosts, getOverheadAllocations } from '@/lib/queries/overhead';
import { getAllProjects } from '@/lib/queries/projects';
import RezijniClient from '@/components/rezijni/RezijniClient';

export const dynamic = 'force-dynamic';

export default async function RezijniNakladyPage() {
  const costs = await getOverheadCosts();
  const allocations = await getOverheadAllocations();
  const projects = await getAllProjects();

  return (
    <RezijniClient
      initialCosts={costs}
      initialAllocations={allocations}
      projects={projects.map(p => ({ id: p.id, name: p.name }))}
    />
  );
}
