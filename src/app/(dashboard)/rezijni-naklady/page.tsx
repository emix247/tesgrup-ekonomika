import { getOverheadCosts, getOverheadAllocations } from '@/lib/queries/overhead';
import { getAllProjects } from '@/lib/queries/projects';
import RezijniClient from '@/components/rezijni/RezijniClient';

export const dynamic = 'force-dynamic';

export default function RezijniNakladyPage() {
  const costs = getOverheadCosts();
  const allocations = getOverheadAllocations();
  const projects = getAllProjects();

  return (
    <RezijniClient
      initialCosts={costs}
      initialAllocations={allocations}
      projects={projects.map(p => ({ id: p.id, name: p.name }))}
    />
  );
}
