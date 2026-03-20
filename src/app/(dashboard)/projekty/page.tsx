import Link from 'next/link';
import { getAllProjects } from '@/lib/queries/projects';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import DeleteProjectButton from '@/components/projekt/DeleteProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjektyPage() {
  const projects = await getAllProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projekty</h1>
          <p className="text-sm text-gray-500 mt-1">Správa developerských projektů</p>
        </div>
        <Link
          href="/projekty/novy"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nový projekt
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Žádné projekty</h3>
          <p className="mt-2 text-sm text-gray-500">Začněte vytvořením prvního projektu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Název</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokalita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stav</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vytvořeno</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <Link href={`/projekty/${p.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {PROJECT_TYPES[p.type as keyof typeof PROJECT_TYPES] || p.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.location || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {PROJECT_STATUSES[p.status as keyof typeof PROJECT_STATUSES] || p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <Link
                      href={`/projekty/${p.id}/upravit`}
                      className="text-xs text-gray-400 hover:text-primary-600"
                    >
                      Upravit
                    </Link>
                    <DeleteProjectButton projectId={p.id} projectName={p.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
