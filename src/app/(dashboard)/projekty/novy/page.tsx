import ProjectForm from '@/components/projekt/ProjectForm';

export default function NovyProjektPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nový projekt</h1>
        <p className="text-sm text-gray-500 mt-1">Vytvořte nový developerský projekt</p>
      </div>
      <ProjectForm />
    </div>
  );
}
