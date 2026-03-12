import { getProjectById } from '@/lib/queries/projects';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/projekt/ProjectForm';

export const dynamic = 'force-dynamic';

export default async function UpravitProjektPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = getProjectById(projectId);
  if (!project) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upravit projekt</h1>
        <p className="text-sm text-gray-500 mt-1">{project.name}</p>
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
