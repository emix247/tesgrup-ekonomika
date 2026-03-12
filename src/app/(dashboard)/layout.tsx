import Sidebar from '@/components/layout/Sidebar';
import { getAllProjects } from '@/lib/queries/projects';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const projects = (await getAllProjects()).map(p => ({ id: p.id, name: p.name }));

  return (
    <div className="min-h-screen">
      <Sidebar projects={projects} />
      <main className="lg:ml-64 min-h-screen">
        {/* pt-16 on mobile for the fixed top bar, p-8 on desktop */}
        <div className="pt-16 px-4 pb-6 sm:px-6 lg:pt-8 lg:px-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
