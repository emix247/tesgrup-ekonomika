import { redirect } from 'next/navigation';

export default async function PredpokladDaneRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projekty/${projectId}/dane-vystupy`);
}
