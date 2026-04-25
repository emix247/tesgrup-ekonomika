import { getRevenueUnits, getRevenueExtras } from '@/lib/queries/revenue';
import { getSales } from '@/lib/queries/sales';
import { getTaxConfig } from '@/lib/queries/tax';
import { getPaymentsByProject } from '@/lib/queries/payments';
import PrijmyUnifiedClient from '@/components/unified/PrijmyUnifiedClient';

export const dynamic = 'force-dynamic';

export default async function PrijmyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [units, extras, sales, taxCfg, payments] = await Promise.all([
    getRevenueUnits(projectId),
    getRevenueExtras(projectId),
    getSales(projectId),
    getTaxConfig(projectId),
    getPaymentsByProject(projectId),
  ]);

  const taxForm = taxCfg?.taxForm || 'sro';
  const isVatPayer = taxForm === 'sro';

  return (
    <PrijmyUnifiedClient
      projectId={projectId}
      initialUnits={units}
      initialExtras={extras}
      initialSales={sales}
      initialPayments={payments}
      isVatPayer={isVatPayer}
    />
  );
}
