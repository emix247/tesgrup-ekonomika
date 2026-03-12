import { getFinancing } from '@/lib/queries/financing';
import { getDrawdowns } from '@/lib/queries/drawdowns';
import FinancovaniUnifiedClient from '@/components/unified/FinancovaniUnifiedClient';

export const dynamic = 'force-dynamic';

export default async function FinancovaniPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const financing = await getFinancing(projectId);
  const drawdowns = await getDrawdowns(projectId);

  return (
    <FinancovaniUnifiedClient
      projectId={projectId}
      initialFinancing={financing}
      initialDrawdowns={drawdowns}
    />
  );
}
