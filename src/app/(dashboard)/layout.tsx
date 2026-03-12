import Sidebar from '@/components/layout/Sidebar';
import { getAllProjects } from '@/lib/queries/projects';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const projects = getAllProjects().map(p => ({ id: p.id, name: p.name }));

  return (
    <div className="min-h-screen">
      <Sidebar projects={projects} />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
