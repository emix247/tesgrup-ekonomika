import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getSales } from '@/lib/queries/sales';
import PrijmyUnifiedClient from '@/components/unified/PrijmyUnifiedClient';

export const dynamic = 'force-dynamic';

export default async function PrijmyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const units = await getRevenueUnits(projectId);
  const extras = await getRevenueExtras(projectId);
  const sales = await getSales(projectId);

  return (
    <PrijmyUnifiedClient
      projectId={projectId}
      initialUnits={units}
      initialExtras={extras}
      initialSales={sales}
    />
  );
}
