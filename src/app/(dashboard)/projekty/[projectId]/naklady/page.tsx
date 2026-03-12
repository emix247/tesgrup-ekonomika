import { getForecastCosts, getActualCosts } from '@/lib/queries/costs';
import NakladyUnifiedClient from '@/components/unified/NakladyUnifiedClient';
import NakladyPieChart from '@/components/charts/NakladyPieChart';
import BarComparisonChart from '@/components/charts/BarComparisonChart';
import { COST_CATEGORIES } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export default async function NakladyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const forecast = getForecastCosts(projectId);
  const actual = getActualCosts(projectId);

  // Build comparison data for bar chart
  const comparisonData = Object.entries(COST_CATEGORIES)
    .map(([key, name]) => ({
      category: name,
      plan: forecast.filter(c => c.category === key).reduce((s, c) => s + c.amount, 0),
      actual: actual.filter(c => c.category === key).reduce((s, c) => s + c.amount, 0),
    }))
    .filter(d => d.plan > 0 || d.actual > 0);

  return (
    <div className="space-y-6">
      <NakladyUnifiedClient
        projectId={projectId}
        initialForecast={forecast}
        initialActual={actual}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NakladyPieChart costs={forecast} />
        {comparisonData.length > 0 && (
          <BarComparisonChart data={comparisonData} title="Plán vs. Skutečnost" layout="horizontal" />
        )}
      </div>
    </div>
  );
}
