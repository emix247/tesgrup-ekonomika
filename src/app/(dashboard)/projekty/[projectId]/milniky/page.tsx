import { getMilestones } from '@/lib/queries/milestones';
import MilnikyClient from '@/components/skutecnost/MilnikyClient';

export const dynamic = 'force-dynamic';

export default async function MilnikyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const milestones = getMilestones(projectId);

  return <MilnikyClient projectId={projectId} initialMilestones={milestones} />;
}
