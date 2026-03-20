import Link from 'next/link';
import { getProjectById } from '@/lib/queries/projects';
import { notFound } from 'next/navigation';
import ProjectNav from '@/components/projekt/ProjectNav';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/utils/constants';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const typeName = PROJECT_TYPES[project.type as keyof typeof PROJECT_TYPES] || project.type;
  const statusName = PROJECT_STATUSES[project.status as keyof typeof PROJECT_STATUSES] || project.status;

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
              {statusName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {typeName}
            {project.location ? ` — ${project.location}` : ''}
          </p>
        </div>
        <Link
          href={`/projekty/${projectId}/upravit`}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          <span className="hidden sm:inline">Upravit</span>
        </Link>
      </div>

      <ProjectNav projectId={projectId} projectStatus={project.status} />

      <div className="mt-4 sm:mt-6">{children}</div>
    </div>
  );
}
